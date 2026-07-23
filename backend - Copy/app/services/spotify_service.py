import base64
import logging
import re
import time
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("mood_capsule.spotify")

_token_cache = {"access_token": None, "expires_at": 0}

TOKEN_URL = "https://accounts.spotify.com/api/token"
SEARCH_URL = "https://api.spotify.com/v1/search"

# Fallback artwork when no track can be matched. Override via settings if you
# have your own hosted placeholder asset (e.g. PLACEHOLDER_MUSIC_ALBUM_ART_URL=/static/...).
PLACEHOLDER_ALBUM_ART_URL = getattr(
    settings, "PLACEHOLDER_MUSIC_ALBUM_ART_URL", "https://via.placeholder.com/300x300.png?text=No+Album+Art"
)

_PUNCT_RE = re.compile(r"[^\w\s]")
_WHITESPACE_RE = re.compile(r"\s+")
_FEAT_RE = re.compile(r"\s*[\(\[]?\s*(feat\.?|ft\.?|featuring)\s+[^)\]]*[\)\]]?", re.IGNORECASE)
_PAREN_RE = re.compile(r"\s*\([^)]*\)\s*")


def _normalize_punctuation(text: str) -> str:
    cleaned = _PUNCT_RE.sub(" ", text)
    cleaned = _WHITESPACE_RE.sub(" ", cleaned).strip()
    return cleaned


def _strip_featuring(text: str) -> str:
    """Drop '(feat. X)' / 'ft. X' / 'featuring X' noise that often trips up exact search."""
    return _WHITESPACE_RE.sub(" ", _FEAT_RE.sub(" ", text)).strip()


def _strip_parentheticals(text: str) -> str:
    """Drop '(Remastered 2011)', '(Live)', etc."""
    return _WHITESPACE_RE.sub(" ", _PAREN_RE.sub(" ", text)).strip()


def _split_artist_title(text: str) -> Optional[tuple[str, str]]:
    """Handle 'Artist - Title' or 'Title by Artist' shapes, either order."""
    if " - " in text:
        left, right = text.split(" - ", 1)
        return left.strip(), right.strip()
    lowered = text.lower()
    if " by " in lowered:
        idx = lowered.index(" by ")
        return text[idx + 4 :].strip(), text[:idx].strip()
    return None


def _build_query_candidates(query: str) -> list[str]:
    """ Ordered list of search-query variants to try, most-specific first. This only changes what string we *search Spotify with* — it never changes the recommendation itself or which track we'd accept as "the" match. """
    candidates = [query]

    no_feat = _strip_featuring(query)
    if no_feat and no_feat not in candidates:
        candidates.append(no_feat)

    no_paren = _strip_parentheticals(no_feat)
    if no_paren and no_paren not in candidates:
        candidates.append(no_paren)

    normalized = _normalize_punctuation(no_paren)
    if normalized and normalized not in candidates:
        candidates.append(normalized)

    split = _split_artist_title(no_paren)
    if split:
        title, artist = split
        field_query = f"track:{title} artist:{artist}"
        if field_query not in candidates:
            candidates.append(field_query)
        swapped = f"{artist} {title}".strip()
        if swapped and swapped not in candidates:
            candidates.append(swapped)

    seen = set()
    ordered = []
    for c in candidates:
        key = c.lower()
        if c and key not in seen:
            seen.add(key)
            ordered.append(c)
    return ordered


def _placeholder() -> dict:
    return {
        "spotify_id": None,
        "title": None,
        "artists": [],
        "album_art_url": PLACEHOLDER_ALBUM_ART_URL,
        "preview_url": None,
        "external_url": None,
        "is_placeholder": True,
    }


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


async def _search_once(client: httpx.AsyncClient, token: str, query: str) -> Optional[dict]:
    try:
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
    return items[0] if items else None


async def search_track(query: str) -> Optional[dict]:
    """ Tries several query variants (punctuation, 'feat.'/parenthetical noise, artist/title order tolerant) before giving up, then falls back to a placeholder album art image so the frontend always gets a usable URL. The recommendation text itself is never altered or substituted — only how we search for its artwork. """
    if not query:
        return _placeholder()

    token = await _get_token()
    if not token:
        return _placeholder()

    candidates = _build_query_candidates(query)

    track = None
    matched_query = None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            for candidate in candidates:
                track = await _search_once(client, token, candidate)
                if track:
                    matched_query = candidate
                    break
    except httpx.HTTPError as exc:
        logger.warning("Spotify client error for %r: %s", query, exc)
        track = None

    if not track:
        logger.info("Spotify: no artwork found for %r after %d attempt(s)", query, len(candidates))
        return _placeholder()

    if matched_query != query:
        logger.info("Spotify: matched %r via fallback query %r", query, matched_query)

    album = track.get("album", {})
    images = album.get("images", [])

    return {
        "spotify_id": track.get("id"),
        "title": track.get("name"),
        "artists": [a.get("name") for a in track.get("artists", [])],
        "album_art_url": images[0]["url"] if images else PLACEHOLDER_ALBUM_ART_URL,
        "preview_url": track.get("preview_url"),
        "external_url": track.get("external_urls", {}).get("spotify"),
        "is_placeholder": False,
    }