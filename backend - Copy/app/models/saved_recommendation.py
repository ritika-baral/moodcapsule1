from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


class SavedRecommendationModel(BaseModel):
    """
    Mongo collection: saved_recommendations
    """

    user_id: str
    session_id: Optional[str] = None
    category: str
    recommendation: dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
