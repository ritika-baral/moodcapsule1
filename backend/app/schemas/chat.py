from typing import Optional

from pydantic import BaseModel


class PreferencesPayload(BaseModel):
    movie_languages: list[str] = []
    music_languages: list[str] = []
    favourite_genres: list[str] = []
    favourite_artists: list[str] = []
    favourite_book_genres: list[str] = []
    favourite_authors: list[str] = []


class OnboardingRequest(BaseModel):
    name: str
    age: int
    region: Optional[str] = None
    preferences: PreferencesPayload


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
