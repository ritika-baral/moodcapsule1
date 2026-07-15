import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("mood_capsule.tmdb")


async def search_title(query: str, media_type: str = "movie") -> Optional[dict]:
    """
    media_type: 'movie' or 'tv'. Returns a normalized dict with poster/rating/overview,
    or None if TMDB is not configured / nothing found.
    """
    if not settings.TMDB_API_KEY or not query:
        return None

    endpoint = f"{settings.TMDB_BASE_URL}/search/{media_type}"
    params = {"api_key": settings.TMDB_API_KEY, "query": query, "include_adult": "false"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(endpoint, params=params)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("TMDB search failed for %r: %s", query, exc)
        return None

    results = data.get("results") or []
    if not results:
        return None

    top = results[0]
    title = top.get("title") or top.get("name")
    release_date = top.get("release_date") or top.get("first_air_date") or ""
    poster_path = top.get("poster_path")

    return {
        "tmdb_id": top.get("id"),
        "title": title,
        "overview": top.get("overview"),
        "poster_url": f"{settings.TMDB_IMAGE_BASE}{poster_path}" if poster_path else None,
        "rating": top.get("vote_average"),
        "year": release_date[:4] if release_date else None,
        "media_type": media_type,
    }
