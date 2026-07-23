import asyncio
import logging
from typing import Optional

from app.services import books_service, gemini_service, podcast_service, spotify_service, tmdb_service

logger = logging.getLogger("mood_capsule.engine")

CATEGORY_LABELS = {
    "movies": "Movies",
    "tv_shows": "TV Shows",
    "music": "Music",
    "books": "Books",
    "podcasts": "Podcasts",
    "activities": "Activities",
    "journal_prompts": "Journal Prompts",
    "quotes": "Quotes",
    "games": "Games",
}

# Categories that get a "primary vs explore outside your taste" split.
SPLIT_CATEGORIES = {"movies", "tv_shows", "music"}

# Categories enriched with a real external API for posters / cover art / album art.
ENRICHABLE = {"movies", "tv_shows", "music", "books", "podcasts"}


async def _enrich_item(category: str, item: dict) -> dict:
    query = item.get("search_query") or item.get("title") or ""
    enriched: Optional[dict] = None

    try:
        if category == "movies":
            enriched = await tmdb_service.search_title(query, media_type="movie")
        elif category == "tv_shows":
            enriched = await tmdb_service.search_title(query, media_type="tv")
        elif category == "music":
            enriched = await spotify_service.search_track(query)
        elif category == "books":
            enriched = await books_service.search_book(query)
        elif category == "podcasts":
            enriched = await podcast_service.search_podcast(query)
    except Exception as exc:  # never let a flaky external API break the response
        logger.warning("Enrichment failed for %s (%r): %s", category, query, exc)
        enriched = None

    item["media"] = enriched  # may be None if API key missing / not found — frontend falls back gracefully
    return item


async def _enrich_group(category: str, items: list[dict]) -> list[dict]:
    if category not in ENRICHABLE or not items:
        return items
    return await asyncio.gather(*[_enrich_item(category, item) for item in items])


async def build_category_recommendations(
    category: str,
    conversation: list[dict],
    user_profile: dict,
    refinement: Optional[str] = None,
) -> dict:
    label = CATEGORY_LABELS.get(category, category.replace("_", " ").title())
    raw = await gemini_service.generate_recommendations(
        category=category,
        category_label=label,
        conversation=conversation,
        user_profile=user_profile,
        refinement=refinement,
    )

    primary = raw.get("primary", []) or []
    explore = raw.get("explore", []) or [] if category in SPLIT_CATEGORIES else []

    primary, explore = await asyncio.gather(
        _enrich_group(category, primary),
        _enrich_group(category, explore),
    )

    return {
        "category": category,
        "label": label,
        "mood_read": raw.get("mood_read", ""),
        "primary": primary,
        "explore": explore,
        "has_explore_section": category in SPLIT_CATEGORIES,
    }


async def build_full_capsule(
    conversation: list[dict],
    user_profile: dict,
    refinement: Optional[str] = None,
) -> dict:
    """✨ Build My Capsule — generate every category together, concurrently."""
    categories = list(CATEGORY_LABELS.keys())
    results = await asyncio.gather(
        *[
            build_category_recommendations(cat, conversation, user_profile, refinement)
            for cat in categories
        ]
    )
    return {cat: res for cat, res in zip(categories, results)}


def summarize_for_capsule(recommendations: dict) -> str:
    """Short text summary of what was recommended, fed into the Mood Capsule prompt for context."""
    if "primary" in recommendations:  # single category result
        titles = [i.get("title") for i in recommendations.get("primary", [])[:3]]
        return f"{recommendations.get('label')}: {', '.join(t for t in titles if t)}"

    parts = []
    for cat, res in recommendations.items():
        titles = [i.get("title") for i in res.get("primary", [])[:2]]
        if titles:
            parts.append(f"{res.get('label')}: {', '.join(t for t in titles if t)}")
    return " | ".join(parts)
