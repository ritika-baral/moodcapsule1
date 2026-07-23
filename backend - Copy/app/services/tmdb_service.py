import logging
import re
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("mood_capsule.tmdb")

# Category-specific fallback artwork. Override these in settings if you have
# your own hosted placeholder assets (e.g. PLACEHOLDER_MOVIE_POSTER_URL=/static/...).
PLACEHOLDER_POSTERS = {
    "movie": getattr(
        settings, "PLACEHOLDER_MOVIE_POSTER_URL", "https://via.placeholder.com/342x513.png?text=No+Poster"
    ),
    "tv": getattr(
        settings, "PLACEHOLDER_TV_POSTER_URL", "https://via.placeholder.com/342x513.png?text=No+Poster"
    ),
}

_PUNCT_RE = re.compile(r"[^\w\s]")
_WHITESPACE_RE = re.compile(r"\s+")
_YEAR_SUFFIX_RE = re.compile(r"\s*\(\d{4}\)\s*$")
_LEADING_ARTICLE_RE = re.compile(r"^(the|a|an)\s+", re.IGNORECASE)


def _normalize_punctuation(text: str) -> str:
    """Lowercase-agnostic cleanup: strip punctuation, collapse whitespace."""
    cleaned = _PUNCT_RE.sub(" ", text)
    cleaned = _WHITESPACE_RE.sub(" ", cleaned).strip()
    return cleaned


def _strip_year_suffix(text: str) -> str:
    """'Title (2020)' -> 'Title'"""
    return _YEAR_SUFFIX_RE.sub("", text).strip()


def _strip_subtitle(text: str) -> str:
    """'Title: Subtitle' -> 'Title'"""
    if ":" in text:
        return text.split(":", 1)[0].strip()
    return text


def _strip_leading_article(text: str) -> str:
    return _LEADING_ARTICLE_RE.sub("", text).strip()


def _build_query_candidates(query: str) -> list[str]:
    """ Ordered list of search-query variants to try, most-specific first. This only changes what string we *search TMDB with* — it never changes the recommendation itself or which result we'd accept as "the" title. """
    candidates = [query]

    stripped_year = _strip_year_suffix(query)
    if stripped_year and stripped_year != query:
        candidates.append(stripped_year)

    no_subtitle = _strip_subtitle(stripped_year or query)
    if no_subtitle and no_subtitle not in candidates:
        candidates.append(no_subtitle)

    normalized = _normalize_punctuation(no_subtitle)
    if normalized and normalized not in candidates:
        candidates.append(normalized)

    no_article = _strip_leading_article(normalized)
    if no_article and no_article not in candidates:
        candidates.append(no_article)

    # De-dupe (case-insensitive) while preserving order, drop empties.
    seen = set()
    ordered = []
    for c in candidates:
        key = c.lower()
        if c and key not in seen:
            seen.add(key)
            ordered.append(c)
    return ordered


def _placeholder(media_type: str) -> dict:
    return {
        "tmdb_id": None,
        "title": None,
        "overview": None,
        "poster_url": PLACEHOLDER_POSTERS.get(media_type, PLACEHOLDER_POSTERS["movie"]),
        "rating": None,
        "year": None,
        "media_type": media_type,
        "is_placeholder": True,
    }


async def _search_once(client: httpx.AsyncClient, media_type: str, query: str) -> Optional[dict]:
    endpoint = f"{settings.TMDB_BASE_URL}/search/{media_type}"
    params = {"api_key": settings.TMDB_API_KEY, "query": query, "include_adult": "false"}

    try:
        resp = await client.get(endpoint, params=params)
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("TMDB search failed for %r: %s", query, exc)
        return None

    results = data.get("results") or []
    return results[0] if results else None


async def search_title(query: str, media_type: str = "movie") -> Optional[dict]:
    """ media_type: 'movie' or 'tv'. Returns a normalized dict with poster/rating/overview. Tries several query variants (punctuation, spacing, subtitle, leading-article tolerant) before giving up, then falls back to a category placeholder poster so the frontend always gets a usable image_url. The recommendation text itself is never altered or substituted — only how we search for its artwork. """
    if not query:
        return _placeholder(media_type)

    if not settings.TMDB_API_KEY:
        return _placeholder(media_type)

    candidates = _build_query_candidates(query)

    top = None
    matched_query = None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            for candidate in candidates:
                top = await _search_once(client, media_type, candidate)
                if top:
                    matched_query = candidate
                    break
    except httpx.HTTPError as exc:
        logger.warning("TMDB client error for %r: %s", query, exc)
        top = None

    if not top:
        logger.info("TMDB: no artwork found for %r after %d attempt(s)", query, len(candidates))
        return _placeholder(media_type)

    if matched_query != query:
        logger.info("TMDB: matched %r via fallback query %r", query, matched_query)

    title = top.get("title") or top.get("name")
    release_date = top.get("release_date") or top.get("first_air_date") or ""
    poster_path = top.get("poster_path")

    return {
        "tmdb_id": top.get("id"),
        "title": title,
        "overview": top.get("overview"),
        "poster_url": (
            f"{settings.TMDB_IMAGE_BASE}{poster_path}" if poster_path else PLACEHOLDER_POSTERS.get(media_type)
        ),
        "rating": top.get("vote_average"),
        "year": release_date[:4] if release_date else None,
        "media_type": media_type,
        "is_placeholder": False,
    }