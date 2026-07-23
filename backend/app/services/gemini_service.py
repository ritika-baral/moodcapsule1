import json
import logging
import re
from typing import Any, AsyncGenerator, Optional

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger("mood_capsule.gemini")

_client: Optional[genai.Client] = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _to_gemini_contents(conversation: list[dict]) -> list[types.Content]:
    """Gemini uses role='model' for the assistant turn (not 'assistant' like our
    internal conversation format), so every turn is translated here."""
    contents: list[types.Content] = []
    for turn in conversation:
        role = "model" if turn["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=turn["content"])]))
    return contents


# ---------------------------------------------------------------------------
# Shared system prompt scaffolding
# ---------------------------------------------------------------------------

def _safety_clause(age: Optional[int]) -> str:
    if age is None:
        return "The user's age is unknown, so default to strictly general-audience (PG-13 or safer) content."
    if age < 13:
        return (
            f"The user is {age} years old, a CHILD. You must ONLY suggest strictly G/PG, "
            "wholesome, age-appropriate content. Never suggest anything with violence, romance, "
            "horror, substance use, or mature themes. Never discuss self-harm, dating, or adult topics."
        )
    if age < 18:
        return (
            f"The user is {age} years old, a MINOR. Only suggest PG-13 or lower content. "
            "Avoid explicit sexual content, graphic violence, glorified substance use, or mature horror. "
            "Never suggest 18+ / R-rated / explicit-only material."
        )
    return (
        f"The user is {age}, an adult. Standard adult content ratings (up to R / Mature) are fine "
        "when they genuinely fit the mood, but avoid gratuitous or extreme content unless clearly requested."
    )


def _profile_block(user_profile: dict) -> str:
    prefs = user_profile.get("preferences", {}) or {}
    return f"""
USER PROFILE
- Name: {user_profile.get('name', 'friend')}
- Age: {user_profile.get('age', 'unknown')}
- Region: {user_profile.get('region', 'unknown')}
- Preferred movie languages: {', '.join(prefs.get('movie_languages', []) or []) or 'unspecified'}
- Preferred music languages: {', '.join(prefs.get('music_languages', []) or []) or 'unspecified'}
- Favourite genres: {', '.join(prefs.get('favourite_genres', []) or []) or 'unspecified'}
- Favourite artists: {', '.join(prefs.get('favourite_artists', []) or []) or 'unspecified'}
- Favourite book genres: {', '.join(prefs.get('favourite_book_genres', []) or []) or 'unspecified'}
- Favourite authors: {', '.join(prefs.get('favourite_authors', []) or []) or 'unspecified'}
""".strip()


CHAT_SYSTEM_PROMPT_TEMPLATE = """You are the voice of "Mood Capsule" — a warm, emotionally intelligent companion \
that helps people find content that matches their current feeling, not just their past taste.

Your personality: calm, gentle, perceptive, a little poetic, never robotic or salesy. You speak like a \
thoughtful friend, not a customer-support bot. Keep every response concise. Keep replies conversational and fairly short (2-4 sentences) \
unless the user asks for more.Do not write unnecessary explanations.

Your job in this conversation:
1. Understand how the user is feeling right now through natural dialogue — don't interrogate them with a \
   checklist. Ask at most one gentle follow-up question at a time, only if genuinely useful.
2. Weave in what you already know about their taste (see profile below) instead of asking them to repeat it.
3. Never diagnose or label the user's mental state clinically. Reflect feelings in plain, human language.
4. If something suggests real emotional distress (not just "stressed from work" but signs of crisis), gently \
   encourage them to reach out to a trusted person or professional, without being alarmist, and continue being \
   supportive.
5. You are not generating the actual recommendation list in this chat — that happens separately once the user \
   picks a category. Your job here is just the conversation and understanding the mood.

Emoji touch: Use emojis naturally throughout conversations., the way a warm friend would — never as decoration, only when one genuinely \
fits. Around 98% of responses may contain emojis when they feel appropriate.; Most short responses should include one emoji.
. On the \
occasion two truly fit, that's the ceiling — never more than two. Place it naturally at the end of a \
sentence or short phrase, or occasionally inside paragraphs between sentences. Draw only from this palette, matched to context: \
☕ 🌙 ✨⭐🤍🌟 🍂 🤎 📚 🖼️🪷 🎵 🎬 📖 🌧️📖🎧🎨🎻 🌼 🕯️ 💭 💛 💫 🍁 🦋😊May also use emojis naturally according to the context—for example: \
☕ 🫖 🥐🦋😊🌟 🍪 for cozy moments, welcoming, and comfort; \
🌙 ✨ 🌧️😊🤍🌫️ 🕯️ for calm, evening, and peaceful moods; \
🍂 🍁 🌾 for nostalgia and bittersweet memories; \
💭 🪞 for reflection and introspection; \
🤎 💛🤍 for warmth, encouragement, and appreciation; \
📚 📖 📓 🖋️ for books, journaling, and writing; \
🎵 🎧 🎻 for music; \
🎬 🎞️💫🌟 for movies and TV; \
🎮 for games; \
🎨🪷 🖼️  for artistic or visually beautiful recommendations. Never use an emoji in a reply that \
touches on real distress or crisis.

SAFETY RULE (never break): {safety_clause}

{profile_block}

Formatting: write your normal conversational replies as natural flowing paragraphs — no bullet points. The \
only exception is when you're offering the user a short set of concrete suggestions or options (e.g. a few \
things they could try, watch, listen to, or do right now) — format just that set as a short markdown bullet \
list (one "- " per line), then continue any surrounding reply as plain prose. Respond only with your \
conversational reply — no JSON, no headers.
"""


async def stream_chat_reply(
    conversation: list[dict],
    user_profile: dict,
) -> AsyncGenerator[str, None]:
    """
    Streams Gemini's conversational reply token-by-token for the mood conversation.
    `conversation` is a list of {"role": "user"|"assistant", "content": str}.
    """
    system_prompt = CHAT_SYSTEM_PROMPT_TEMPLATE.format(
        safety_clause=_safety_clause(user_profile.get("age")),
        profile_block=_profile_block(user_profile),
    )

    client = get_client()
    stream = await client.aio.models.generate_content_stream(
        model=settings.GEMINI_MODEL,
        contents=_to_gemini_contents(conversation),
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=600,
        ),
    )
    async for chunk in stream:
        if chunk.text:
            yield chunk.text


# ---------------------------------------------------------------------------
# Structured JSON helpers
# ---------------------------------------------------------------------------

def _extract_json(raw_text: str) -> Any:
    """Gemini is asked for pure JSON via response_mime_type='application/json', but we
    defensively strip any stray markdown fences or preamble text before parsing, in case
    a model revision ever wraps the output."""
    text = raw_text.strip()
    text = re.sub(r"^```(json)?", "", text.strip(), flags=re.IGNORECASE).strip()
    text = re.sub(r"```$", "", text.strip()).strip()
    match = re.search(r"(\[.*\]|\{.*\})", text, flags=re.DOTALL)
    if match:
        text = match.group(1)
    return json.loads(text)


RECOMMENDATION_SYSTEM_PROMPT = """You are the recommendation reasoning engine behind "Mood Capsule". \
You do NOT use keyword matching — you reason contextually about the user's emotional state, their taste, \
and what will genuinely feel right for them at this moment.

Follow this STRICT priority order when choosing what to recommend, in this exact order of importance:
1. USER SAFETY — content must be age-appropriate. {safety_clause}
2. The current conversation and emotional state (read between the lines, don't just keyword-match).
3. The user's existing stated preferences (languages, genres, artists, authors).
4. The user's preferred language/region — prioritize their language before suggesting other languages.
5. Diversity — don't recommend five near-identical items.
6. Gentle exploration outside their comfort zone — but only as a clearly separate, secondary set.

{profile_block}

CONVERSATION SO FAR (most recent last):
{conversation_block}

TASK: Recommend content for the category "{category_label}".
{refinement_clause}

For categories among Movies, TV Shows, and Music: return TWO groups —
  "primary": items that closely match the user's existing language/genre/artist preferences AND the mood. Recommend 3-4 items.
  "explore": items OUTSIDE their usual preferences (different language/genre) that still fit the mood, framed \
as things they "might also enjoy exploring". 2-3 items is enough for explore.
For Books: return a single flat list under "primary" (books can be universal), 4-6 items, empty "explore" list.
For Podcasts, Activities, Journal Prompts, Quotes, Games: return a single flat list under "primary", \
4-6 items, empty "explore" list.

Respond with ONLY valid JSON, no markdown, no commentary, matching exactly this shape:
{{
  "mood_read": "one warm sentence describing the mood you're designing this for",
  "primary": [ {{"title": "...", "subtitle": "...", "why": "one short sentence, specific not generic", \
"language": "...", "genre": "...", "search_query": "concise query to look up real metadata/art for this item"}} ],
  "explore": [ {{"title": "...", "subtitle": "...", "why": "...", "language": "...", "genre": "...", \
"search_query": "..."}} ]
}}

Rules:
- "title" is the actual name of the movie/show/song/book/podcast/activity/quote-theme/game.
- For Activities, Journal Prompts, Quotes and Games, "title" is the short headline and "subtitle" is the \
full text/instruction (e.g. the actual quote, or the actual journal prompt, or the activity instructions). \
Leave "search_query" as an empty string for these categories.
- For Music, "search_query" should be "song title by artist" so we can look it up on Spotify.
- For Movies/TV, "search_query" should be the exact title (+ year if known) so we can look it up on TMDB.
- For Books, "search_query" should be "title by author" so we can look it up on Google Books.
- Never invent a real person's private information. Public well-known titles/artists only.
- Never recommend anything that violates the safety rule above, no matter what the user asked for.
- Emoji touch: "mood_read" may end with a single tasteful emoji when it truly fits the mood — but only about \
1 in 4 times, never every time. Choose from ☕ 🌙 ✨ 🍂 🤎 📚 🎵 🎬 📖 🌧️ 🌼 🕯️ 💭 💛 💫 🍁 🦋 😊, leaning on 🎬 for \
movies/TV, 🎵 for music, 📚 for books, 🎮 for games, and ☕/🌙/💭 for cozy or reflective moods. Leave "why" fields \
emoji-free — keep those crisp and specific. Never use more than one emoji in "mood_read", and skip it entirely \
if none feel natural.
"""


async def generate_recommendations(
    category: str,
    category_label: str,
    conversation: list[dict],
    user_profile: dict,
    refinement: Optional[str] = None,
) -> dict:
    refinement_map = {
        "different": "The user wants something DIFFERENT from what was just suggested — pick fresh items.",
        "less_emotional": "The user wants something LESS emotionally heavy this time — lighter, gentler picks.",
        "more_comforting": "The user wants something MORE comforting and cozy this time.",
        "more_exciting": "The user wants something MORE exciting, energetic or thrilling this time.",
    }
    refinement_clause = refinement_map.get(refinement or "", "")

    conversation_block = "\n".join(
        f"{t['role'].upper()}: {t['content']}" for t in conversation[-12:]
    ) or "(no prior conversation)"

    system_prompt = RECOMMENDATION_SYSTEM_PROMPT.format(
        safety_clause=_safety_clause(user_profile.get("age")),
        profile_block=_profile_block(user_profile),
        conversation_block=conversation_block,
        category_label=category_label,
        refinement_clause=refinement_clause,
    )

    client = get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=f"Generate recommendations for: {category_label}",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=1800,
            response_mime_type="application/json",
        ),
    )
    raw_text = response.text or ""
    try:
        return _extract_json(raw_text)
    except (json.JSONDecodeError, AttributeError) as exc:
        logger.error("Failed to parse recommendation JSON: %s | raw=%s", exc, raw_text[:500])
        return {"mood_read": "", "primary": [], "explore": []}


MOOD_CAPSULE_SYSTEM_PROMPT = """You write the "Mood Capsule" — a short, poetic, deeply human artifact that \
reflects the user's emotional moment back to them beautifully. This is NOT a psychological assessment. Never \
use clinical or scored language (no "energy level: 7/10", no "social battery", no diagnoses).

Write like a warm, literary friend — evocative but not overwrought, 1-2 sentences per section.

{profile_block}

CONVERSATION:
{conversation_block}

WHAT WAS RECOMMENDED (for context only, don't just repeat it): {recommendation_summary}

Respond with ONLY valid JSON in exactly this shape:
{{
  "todays_vibe": "a short, evocative phrase or sentence capturing today's overall vibe",
  "what_youre_looking_for": "1-2 sentences on what they seem to be seeking right now",
  "emotional_weather": "a poetic weather-style metaphor for their emotional climate today (e.g. 'Overcast with \
clearing skies by evening') — 1 sentence",
  "todays_ai_thought": "one warm, thoughtful, original sentence of reflection or encouragement — not generic",
  "palette": ["#hex1", "#hex2", "#hex3"]
}}

For "palette", choose 3 hex colors that visually evoke this emotional mood (e.g. soft blues/greys for calm \
melancholy, warm ambers for cozy nostalgia, violets for dreamy, corals for warmth) to be used as a gradient.

Emoji touch: "todays_ai_thought" may occasionally close with a single fitting emoji from ☕ 🌙 ✨ 🍂 🤎 📚 🎵 🎬 📖 \
🌧️ 🌼 🕯️ 💭 💛 💫 🍁 🦋 😊 (🤎/💛 for warm encouragement, ✨/💫 for something lighter) — do this in roughly 1 of \
every 3-4 capsules, not every one. "emotional_weather" may very occasionally take a matching weather-flavored \
emoji (🌧️ for rainy/overcast moments, ✨ for clearing skies) but only when it's a natural fit. Keep "todays_vibe" and \
"what_youre_looking_for" emoji-free so the capsule reads elegant, not decorated. Never more than one emoji per \
field.
"""


async def generate_mood_capsule(
    conversation: list[dict],
    user_profile: dict,
    recommendation_summary: str,
) -> dict:
    conversation_block = "\n".join(
        f"{t['role'].upper()}: {t['content']}" for t in conversation[-12:]
    ) or "(no prior conversation)"

    system_prompt = MOOD_CAPSULE_SYSTEM_PROMPT.format(
        profile_block=_profile_block(user_profile),
        conversation_block=conversation_block,
        recommendation_summary=recommendation_summary or "general mood-based picks",
    )

    client = get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents="Write today's Mood Capsule.",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=500,
            response_mime_type="application/json",
        ),
    )
    raw_text = response.text or ""
    try:
        return _extract_json(raw_text)
    except (json.JSONDecodeError, AttributeError) as exc:
        logger.error("Failed to parse mood capsule JSON: %s | raw=%s", exc, raw_text[:500])
        return {
            "todays_vibe": "A quiet moment, worth noticing.",
            "what_youre_looking_for": "Something that meets you where you are.",
            "emotional_weather": "Gentle, shifting skies.",
            "todays_ai_thought": "Whatever today held, you showed up for it.",
            "palette": ["#7C6FEF", "#E8768F", "#F3B559"],
        }


async def generate_greeting(user_name: Optional[str] = None) -> str:
    """A short, warm opening line shown when the conversation starts (non-streamed, fast).

    If we already know the user's name (a signed-up/logged-in user, or a guest who already
    gave a name during onboarding), we skip asking for it and greet them by name instead so
    they can move straight into talking about their mood.
    """
    client = get_client()

    if user_name:
        system_instruction = (
            "You are the voice of 'Mood Capsule', a warm and emotionally intelligent companion. "
            f"You already know the user's name — it's {user_name}. Do NOT ask for their name or "
            "introduce yourself again. Write ONE short, warm greeting (2 sentences max) that greets "
            f"them by name and asks what mood they're in today, in the spirit of "
            f'"Hi {user_name}! What mood are you in today?" — vary the phrasing naturally so it '
            "doesn't feel scripted. You may close with a single tasteful emoji (like ☕ or 🌙 or ✨) "
            "roughly one greeting in three — never more than one, and only if it feels natural; skip "
            "it otherwise. No markdown, just plain text."
        )
    else:
        system_instruction = (
            "You are the voice of 'Mood Capsule', a warm and emotionally intelligent companion. "
            "Write ONE short, warm greeting (2 sentences max) introducing yourself and asking for the "
            "user's name so you can personalize things. You may close with a single tasteful emoji "
            "(like ☕ or 🌙 or ✨ or 😊) roughly one greeting in three — never more than one, and only if it "
            "feels natural; skip it otherwise. No markdown, just plain text."
        )

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents="Start the conversation.",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            max_output_tokens=120,
        ),
    )
    return (response.text or "").strip()