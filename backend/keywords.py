import re
import spacy

HOUSE_KEYWORDS = {"house", "subdivision", "home", "villa"}
CONDO_KEYWORDS = {"condo", "apartment"}
WORKPLACE_KEYWORDS = {"office", "work", "job site", "workplace", "site", "commute"}

GIBBERISH_REGEX_1 = re.compile(r"[a-zA-Z]{4,}\d+|\d+[a-zA-Z]{4,}")
GIBBERISH_REGEX_2 = re.compile(
    r"(asdf|qwerty|zxcv|ghjkl|1234|qwer|dfgh|hjkl|aaaa|zzzz|xxxx)"
)

# Updated WORKPLACE_REGEX to include "workplace is", "workplace is at", etc.
WORKPLACE_REGEX = re.compile(
    r"(?:work at|workplace is at|workplace is|my workplace is|office is at|office in|near|close to|job at|workplace in)\s+([a-zA-Z0-9\s]+?)(?:,|\.|$|find|with|under)",
    re.IGNORECASE,
)

MAX_COMMUTE_REGEX = re.compile(
    r"(?:under|less than|within|max|below)\s*(\d+)\s*(?:min|mins|minute|minutes)",
    re.IGNORECASE,
)


def normalize_input(text: str) -> str:
    return re.sub(r"(\d+)\s*([a-zA-Z]+)", r"\1 \2", text, flags=re.IGNORECASE)


def has_gibberish_or_nonsense(doc: spacy.tokens.Doc) -> bool:
    vowels = set("aeiouyAEIOUY")
    for token in doc:
        if not token.is_alpha:
            if GIBBERISH_REGEX_1.search(token.text):
                return True
            continue

        text = token.text.lower()
        if len(text) > 5 and not any(c in vowels for c in text):
            return True
        if GIBBERISH_REGEX_2.search(text) or re.search(r"(.)\1{2,}", text):
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

    match_k = re.search(r"(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)", text_clean)
    if match_k:
        return float(match_k.group(1)) * 1_000

    match_raw = re.findall(r"\b\d{5,10}\b", text_clean)
    return float(match_raw[0]) if match_raw else None


def parse_max_commute_time(text: str) -> int | None:
    match = MAX_COMMUTE_REGEX.search(text)
    return int(match.group(1)) if match else None


def extract_preferences(text: str, doc: spacy.tokens.Doc) -> dict:
    text_lower = text.lower()

    category = None
    if any(k in text_lower for k in HOUSE_KEYWORDS):
        category = "house"
    elif any(k in text_lower for k in CONDO_KEYWORDS):
        category = "condo"

    locations = [
        ent.text
        for ent in doc.ents
        if ent.label_ in ("GPE", "FAC", "LOC", "ORG")
    ]

    return {
        "budget": parse_budget(text),
        "category": category,
        "locations": locations,
        "has_subdivision": "subdivision" in text_lower or "village" in text_lower,
        "wants_near_office": any(k in text_lower for k in WORKPLACE_KEYWORDS),
    }