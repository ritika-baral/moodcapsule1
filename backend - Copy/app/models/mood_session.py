from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MoodCapsule(BaseModel):
    todays_vibe: str = ""
    what_youre_looking_for: str = ""
    emotional_weather: str = ""
    todays_ai_thought: str = ""
    palette: list[str] = Field(default_factory=list)  # 2-4 hex colors describing the mood, for the UI gradient


class MoodSessionModel(BaseModel):
    """
    Mongo collection: mood_sessions
    """

    user_id: str
    conversation: list[ChatTurn] = Field(default_factory=list)
    detected_mood: Optional[str] = None
    category: Optional[str] = None  # selected recommendation category, or "build_my_capsule"
    recommendations: dict[str, Any] = Field(default_factory=dict)
    mood_capsule: Optional[MoodCapsule] = None
    saved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
