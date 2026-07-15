import base64
import logging
import time
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("mood_capsule.spotify")

_token_cache = {"access_token": None, "expires_at": 0}

TOKEN_URL = "https://accounts.spotify.com/api/token"
SEARCH_URL = "https://api.spotify.com/v1/search"


async def _get_token() -> Optional[str]:
    if not settings.SPOTIFY_CLIENT_ID or not settings.SPOTIFY_CLIENT_SECRET:
        return None

    if _token_cache["access_token"] and _token_cache["expires_at"] > time.time() + 30:
        return _token_cache["access_token"]

    creds = f"{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}"
    encoded = base64.b64encode(creds.encode()).decode()

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                TOKEN_URL,
                data={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {encoded}"},
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Spotify auth failed: %s", exc)
        return None

    _token_cache["access_token"] = data.get("access_token")
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
    return _token_cache["access_token"]


async def search_track(query: str) -> Optional[dict]:
    if not query:
        return None

    token = await _get_token()
    if not token:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                SEARCH_URL,
                params={"q": query, "type": "track", "limit": 1},
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Spotify search failed for %r: %s", query, exc)
        return None

    items = (data.get("tracks") or {}).get("items") or []
    if not items:
        return None

    track = items[0]
    album = track.get("album", {})
    images = album.get("images", [])

    return {
        "spotify_id": track.get("id"),
        "title": track.get("name"),
        "artists": [a.get("name") for a in track.get("artists", [])],
        "album_art_url": images[0]["url"] if images else None,
        "preview_url": track.get("preview_url"),
        "external_url": track.get("external_urls", {}).get("spotify"),
    }
