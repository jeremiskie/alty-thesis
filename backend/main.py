import json
import os
import re
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")

if not SUPABASE_KEY:
    print("⚠️ WARNING: SUPABASE_KEY is missing in your .env file!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
nlp = spacy.load("en_core_web_sm")

app = FastAPI(
    title="Property Recommendation Assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserPrompt(BaseModel):
    message: str


def normalize_input(text: str) -> str:
    return re.sub(r"(\d+)\s*([a-zA-Z]+)", r"\1 \2", text, flags=re.IGNORECASE)


def has_gibberish_or_nonsense(doc: spacy.tokens.Doc) -> bool:
    vowels = set("aeiouyAEIOUY")
    for token in doc:
        if not token.is_alpha:
            if re.search(r"[a-zA-Z]{4,}\d+|\d+[a-zA-Z]{4,}", token.text):
                return True
            continue

        text = token.text.lower()
        if len(text) > 5 and not any(c in vowels for c in text):
            return True
        if re.search(
            r"(asdf|qwerty|zxcv|ghjkl|1234|qwer|dfgh|hjkl|aaaa|zzzz|xxxx)", text
        ):
            return True
        if re.search(r"(.)\1{2,}", text):
            return True
    return False


def parse_budget(text: str) -> float | None:
    text_clean = text.lower().replace(",", "")

    match_b = re.search(r"(\d+(?:\.\d+)?)\s*(?:b|billion|billions)", text_clean)
    if match_b:
        return float(match_b.group(1)) * 1_000_000_000

    match_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|million|millions)", text_clean)
    if match_m:
        return float(match_m.group(1)) * 1_000_000

    match_k = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)", text_clean
    )
    if match_k:
        return float(match_k.group(1)) * 1_000

    match_raw = re.findall(r"\b\d{5,10}\b", text_clean)
    if match_raw:
        return float(match_raw[0])

    return None


def extract_preferences(text: str, doc: spacy.tokens.Doc) -> dict:
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


@app.post("/chat")
async def chat_assistant(prompt: UserPrompt):
    raw_message = prompt.message.strip()

    if len(raw_message) < 3:
        return {
            "status": "rejected",
            "reply": "Please enter a valid message regarding your property preferences.",
            "recommendations": [],
        }

    normalized_message = normalize_input(raw_message)
    doc = nlp(normalized_message)

    if has_gibberish_or_nonsense(doc):
        return {
            "status": "rejected",
            "reply": "I could not understand your request because it contains unrecognized or invalid words. Please state your real estate inquiry clearly.",
            "recommendations": [],
        }

    preferences = extract_preferences(normalized_message, doc)

    if not preferences["budget"] and not preferences["category"]:
        return {
            "status": "casual_chat",
            "reply": "Hello! I am your real estate assistant. Please provide your target budget, preferred location, or property type (e.g., 'I have 5 Million budget for a house in a subdivision').",
            "recommendations": [],
        }

    try:
        query = supabase.table("listings").select("*")

        if preferences["budget"]:
            query = query.lte("price_total", preferences["budget"])

        if preferences["category"]:
            query = query.ilike("category", preferences["category"])

        if preferences["has_subdivision"]:
            query = query.or_("village_name.ilike.%subdivision%,village_name.ilike.%village%")

        response = query.order("price_total", desc=True).limit(3).execute()
        rows = response.data

    except Exception as e:
        print(f"Supabase Query Error: {e}")
        return {
            "status": "error",
            "reply": f"Database error occurred: {str(e)}",
            "recommendations": [],
        }

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

        if isinstance(item.get("amenity_list"), str):
            item["amenity_list"] = json.loads(item["amenity_list"])

        if isinstance(item.get("nearby_establishments"), str):
            item["nearby_establishments"] = json.loads(item["nearby_establishments"])

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