from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    age: int = Field(ge=5, le=120)
    email: EmailStr
    password: str = Field(min_length=8)
    region: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GuestStartRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    age: int = Field(ge=5, le=120)
    region: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_guest: bool
    user: dict
