import re
from contextlib import asynccontextmanager
import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy

# ---------------------------------------------------------
# DATABASE CONFIGURATION
# ---------------------------------------------------------
DB_CONFIG = {
    "user": "postgres",
    "password": "tetsuyavirtus",
    "database": "property_db",
    "host": "localhost",
    "port": 5432,
}

db_pool: asyncpg.Pool = None
nlp = spacy.load("en_core_web_sm")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    db_pool = await asyncpg.create_pool(**DB_CONFIG)
    yield
    await db_pool.close()


app = FastAPI(
    title="Property Recommendation Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for React Frontend (running on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserPrompt(BaseModel):
    message: str


# ---------------------------------------------------------
# HELPER FUNCTIONS (TEXT NORMALIZATION & NLP)
# ---------------------------------------------------------
def normalize_input(text: str) -> str:
    """
    Inserts spaces between numbers and attached words.
    Example: '8Million' -> '8 Million', '500thousand' -> '500 thousand'
    """
    return re.sub(r"(\d+)\s*([a-zA-Z]+)", r"\1 \2", text, flags=re.IGNORECASE)


def has_gibberish_or_nonsense(doc: spacy.tokens.Doc) -> bool:
    """Detects nonsense character sequences or invalid word structures."""
    vowels = set("aeiouyAEIOUY")

    for token in doc:
        # Check tokens for mixed alphanumeric gibberish (e.g., 'qwwerty123asdf')
        if not token.is_alpha:
            if re.search(r"[a-zA-Z]{4,}\d+|\d+[a-zA-Z]{4,}", token.text):
                return True
            continue

        text = token.text.lower()

        # 1. Words longer than 5 letters with NO vowels
        if len(text) > 5 and not any(c in vowels for c in text):
            return True

        # 2. Keyboard walks / common spam patterns
        if re.search(
            r"(asdf|qwerty|zxcv|ghjkl|1234|qwer|dfgh|hjkl|aaaa|zzzz|xxxx)", text
        ):
            return True

        # 3. Three or more consecutive identical characters
        if re.search(r"(.)\1{2,}", text):
            return True

    return False


def parse_budget(text: str) -> float | None:
    """
    Parses numeric budget patterns including full words and shortcuts:
    - Billions: 1.5B, 2 Billion, 2 Billions
    - Millions: 8M, 8Million, 8 Millions, 8.5 million
    - Thousands: 500K, 500Thousand, 500 Thousands
    - Raw numbers: 5000000, 8,000,000
    """
    text_clean = text.lower().replace(",", "")

    # Match Billions (e.g., 1b, 2 billion, 2 billions)
    match_b = re.search(r"(\d+(?:\.\d+)?)\s*(?:b|billion|billions)", text_clean)
    if match_b:
        return float(match_b.group(1)) * 1_000_000_000

    # Match Millions (e.g., 8m, 8million, 8 millions)
    match_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|million|millions)", text_clean)
    if match_m:
        return float(match_m.group(1)) * 1_000_000

    # Match Thousands (e.g., 500k, 500thousand, 500 thousands)
    match_k = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)", text_clean
    )
    if match_k:
        return float(match_k.group(1)) * 1_000

    # Match raw standalone numbers >= 10,000
    match_raw = re.findall(r"\b\d{5,10}\b", text_clean)
    if match_raw:
        return float(match_raw[0])

    return None


def extract_preferences(text: str, doc: spacy.tokens.Doc) -> dict:
    """Extracts budget, category, locations, subdivision preference, and office proximity intent."""
    budget = parse_budget(text)
    text_lower = text.lower()

    category = None
    if any(k in text_lower for k in ["house", "subdivision", "home", "villa"]):
        category = "house"
    elif any(k in text_lower for k in ["condo", "apartment"]):
        category = "condo"

    wants_near_office = any(
        k in text_lower
        for k in ["office", "work", "job site", "workplace", "site"]
    )

    locations = [
        ent.text
        for ent in doc.ents
        if ent.label_ in ("GPE", "FAC", "LOC", "ORG")
    ]
    has_subdivision = "subdivision" in text_lower or "village" in text_lower

    return {
        "budget": budget,
        "category": category,
        "locations": locations,
        "has_subdivision": has_subdivision,
        "wants_near_office": wants_near_office,
    }


# ---------------------------------------------------------
# API ENDPOINT
# ---------------------------------------------------------
@app.post("/chat")
async def chat_assistant(prompt: UserPrompt):
    raw_message = prompt.message.strip()

    if len(raw_message) < 3:
        return {
            "status": "rejected",
            "reply": "Please enter a valid message regarding your property preferences.",
            "recommendations": [],
        }

    # Normalize input BEFORE spaCy processing (e.g., '8Million' -> '8 Million')
    normalized_message = normalize_input(raw_message)
    doc = nlp(normalized_message)

    # Reject prompts containing real gibberish/nonsense
    if has_gibberish_or_nonsense(doc):
        return {
            "status": "rejected",
            "reply": "I could not understand your request because it contains unrecognized or invalid words. Please state your real estate inquiry clearly.",
            "recommendations": [],
        }

    preferences = extract_preferences(normalized_message, doc)

    # Casual conversation response
    if not preferences["budget"] and not preferences["category"]:
        return {
            "status": "casual_chat",
            "reply": "Hello! I am your real estate assistant. Please provide your target budget, preferred location, or property type (e.g., 'I have 5 Million budget for a house in a subdivision').",
            "recommendations": [],
        }

    # Query PostgreSQL
    query = """
        SELECT 
            listing_id, title, category, price_total, monthly_rate, 
            num_bedrooms, num_bathrooms, village_name, lat, lng, 
            photos, amenity_list, details 
        FROM listings 
        WHERE 1=1
    """
    params = []
    param_idx = 1

    if preferences["budget"]:
        query += f" AND price_total <= ${param_idx}"
        params.append(preferences["budget"])
        param_idx += 1

    if preferences["category"]:
        query += f" AND LOWER(category) = LOWER(${param_idx})"
        params.append(preferences["category"])
        param_idx += 1

    if preferences["has_subdivision"]:
        query += " AND (LOWER(village_name) LIKE '%subdivision%' OR LOWER(village_name) LIKE '%village%')"

    query += " ORDER BY price_total DESC LIMIT 3;"

    async with db_pool.acquire() as connection:
        rows = await connection.fetch(query, *params)

    results = []
    for row in rows:
        item = dict(row)
        item["lat"] = float(item["lat"]) if item["lat"] is not None else None
        item["lng"] = float(item["lng"]) if item["lng"] is not None else None
        item["price_total"] = (
            float(item["price_total"])
            if item["price_total"] is not None
            else None
        )
        item["monthly_rate"] = (
            float(item["monthly_rate"])
            if item["monthly_rate"] is not None
            else None
        )
        results.append(item)

    if not results:
        return {
            "status": "no_match",
            "reply": f"No available listings found under ₱{preferences['budget']:,.2f} matching your specifications.",
            "preferences_detected": preferences,
            "recommendations": [],
        }

    if preferences["wants_near_office"] and not preferences["locations"]:
        return {
            "status": "clarification_needed",
            "reply": f"Your request is incomplete. I found options within your budget of ₱{preferences['budget']:,.2f}, but could you please provide the exact city or address of your workplace so I can calculate the nearest property?",
            "preferences_detected": preferences,
            "recommendations": results,
        }

    top_match = results[0]
    return {
        "status": "recommendation_found",
        "reply": f"Based on your budget of ₱{preferences['budget']:,.2f}, I recommend '{top_match['title']}' located in {top_match['village_name']} with {top_match['num_bedrooms']} bedrooms for ₱{top_match['price_total']:,.2f}.",
        "preferences_detected": preferences,
        "recommendations": results,
    }