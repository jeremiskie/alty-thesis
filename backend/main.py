from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import nlp, supabase
from keywords import (
    WORKPLACE_REGEX,
    extract_preferences,
    has_gibberish_or_nonsense,
    normalize_input,
    parse_max_commute_time,
)
from schemas import UserPrompt
from services.geocoding import calculate_osrm_commute, geocode_location
from services.property_service import format_listing_row

app = FastAPI(title="Property Recommendation Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/properties")
async def get_properties():
    try:
        response = supabase.table("listings").select("*").execute()
        return [format_listing_row(row) for row in (response.data or [])]
    except Exception as e:
        return {"error": str(e)}


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
            "reply": "I could not understand your request because it contains unrecognized or invalid words.",
            "recommendations": [],
        }

    preferences = extract_preferences(normalized_message, doc)

    work_lat, work_lng, work_name = (
        prompt.workplace_lat,
        prompt.workplace_lng,
        prompt.workplace_name,
    )
    detected_workplace = None

    # Detect location phrases
    workplace_match = WORKPLACE_REGEX.search(normalized_message)
    if workplace_match:
        geo = geocode_location(workplace_match.group(1).strip())
        if geo:
            work_lat, work_lng, work_name = geo["lat"], geo["lng"], geo["name"]
            detected_workplace = geo

    max_commute_mins = parse_max_commute_time(normalized_message)

    if (
        not preferences["budget"]
        and not preferences["category"]
        and not work_name
    ):
        return {
            "status": "casual_chat",
            "reply": "Hello! I am your real estate assistant. Please provide your budget or workplace (e.g., 'I work at BGC Taguig').",
            "recommendations": [],
        }

    try:
        query = supabase.table("listings").select("*")
        if preferences["budget"]:
            query = query.lte("price_total", preferences["budget"])
        if preferences["category"]:
            query = query.ilike("category", preferences["category"])
        if preferences["has_subdivision"]:
            query = query.or_(
                "village_name.ilike.%subdivision%,village_name.ilike.%village%"
            )

        rows = query.execute().data or []
    except Exception as e:
        return {
            "status": "error",
            "reply": f"Database error: {str(e)}",
            "recommendations": [],
        }

    results = [format_listing_row(row) for row in rows]

    # Calculate routes & filter by commute time
    if work_lat and work_lng:
        filtered = []
        for item in results:
            if item.get("lat") and item.get("lng"):
                commute = calculate_osrm_commute(
                    item["lat"], item["lng"], work_lat, work_lng
                )
                if commute:
                    item["commute_info"] = commute
                    if (
                        max_commute_mins
                        and commute["duration_mins"] > max_commute_mins
                    ):
                        continue
            filtered.append(item)

        filtered.sort(
            key=lambda x: x.get("commute_info", {}).get(
                "duration_mins", float("inf")
            )
            if x.get("commute_info")
            else float("inf")
        )
        results = filtered

    results = results[:3]

    if not results:
        return {
            "status": "no_match",
            "reply": "No available listings found matching your specifications.",
            "preferences_detected": preferences,
            "detected_workplace": detected_workplace,
            "recommendations": [],
        }

    reply_msg = (
        f"I found {len(results)} properties within {max_commute_mins} mins commute to {work_name}."
        if work_name and max_commute_mins
        else f"I calculated travel routes to {work_name} and ranked them by shortest commute!"
        if work_name
        else f"Based on your budget of ₱{preferences['budget']:,.2f}, I recommend '{results[0]['title']}'."
        if preferences["budget"]
        else "Here are the top options matching your search."
    )

    return {
        "status": "recommendation_found",
        "reply": reply_msg,
        "preferences_detected": preferences,
        "detected_workplace": detected_workplace,
        "recommendations": results,
    }