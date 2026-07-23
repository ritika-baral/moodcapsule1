from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Preferences(BaseModel):
    movie_languages: list[str] = Field(default_factory=list)
    music_languages: list[str] = Field(default_factory=list)
    favourite_genres: list[str] = Field(default_factory=list)
    favourite_artists: list[str] = Field(default_factory=list)
    favourite_book_genres: list[str] = Field(default_factory=list)
    favourite_authors: list[str] = Field(default_factory=list)


class UserModel(BaseModel):
    """
    Mongo collection: users
    Works for both registered users and guests (guest_id set, email None).
    """

    name: str
    age: Optional[int] = None
    email: Optional[EmailStr] = None
    hashed_password: Optional[str] = None
    guest_id: Optional[str] = None
    region: Optional[str] = None
    language: Optional[str] = None
    preferences: Preferences = Field(default_factory=Preferences)
    is_guest: bool = False
    onboarding_complete: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
