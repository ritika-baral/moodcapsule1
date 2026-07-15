import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("mood_capsule.books")

GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes"


async def search_book(query: str) -> Optional[dict]:
    if not query:
        return None

    params = {"q": query, "maxResults": 1}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(GOOGLE_BOOKS_ENDPOINT, params=params)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Google Books search failed for %r: %s", query, exc)
        return None

    items = data.get("items") or []
    if not items:
        return None

    info = items[0].get("volumeInfo", {})
    image_links = info.get("imageLinks", {})

    return {
        "google_books_id": items[0].get("id"),
        "title": info.get("title"),
        "authors": info.get("authors", []),
        "description": info.get("description"),
        "cover_url": (image_links.get("thumbnail") or image_links.get("smallThumbnail") or "").replace(
            "http://", "https://"
        )
        or None,
        "rating": info.get("averageRating"),
        "published_date": info.get("publishedDate"),
    }
