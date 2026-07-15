from typing import Optional

from pydantic import BaseModel

VALID_CATEGORIES = [
    "build_my_capsule",
    "movies",
    "tv_shows",
    "music",
    "books",
    "podcasts",
    "activities",
    "journal_prompts",
    "quotes",
    "games",
]


class RecommendationRequest(BaseModel):
    session_id: str
    category: str  # one of VALID_CATEGORIES
    refinement: Optional[str] = None  # e.g. "less_emotional" | "more_comforting" | "more_exciting" | "different"


class SaveRecommendationRequest(BaseModel):
    session_id: str
    category: str
    recommendation: dict
