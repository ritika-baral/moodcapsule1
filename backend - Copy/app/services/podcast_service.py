import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("mood_capsule.podcasts")

SEARCH_URL = "https://listen-api.listennotes.com/api/v2/search"


async def search_podcast(query: str) -> Optional[dict]:
    if not settings.LISTEN_NOTES_API_KEY or not query:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                SEARCH_URL,
                params={"q": query, "type": "podcast", "len_min": 0},
                headers={"X-ListenAPI-Key": settings.LISTEN_NOTES_API_KEY},
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Listen Notes search failed for %r: %s", query, exc)
        return None

    results = data.get("results") or []
    if not results:
        return None

    top = results[0]
    return {
        "listennotes_id": top.get("id"),
        "title": top.get("title_original"),
        "publisher": top.get("publisher_original"),
        "thumbnail_url": top.get("thumbnail"),
        "listennotes_url": top.get("listennotes_url"),
    }
