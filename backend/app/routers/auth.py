from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import create_access_token, hash_password, new_guest_id, verify_password
from app.db.mongodb import get_db
from app.schemas.auth import GuestStartRequest, LoginRequest, SignupRequest, TokenResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public_user(user: dict) -> dict:
    return {
        "id": str(user.get("_id")),
        "name": user.get("name"),
        "age": user.get("age"),
        "region": user.get("region"),
        "is_guest": user.get("is_guest", False),
        "onboarding_complete": user.get("onboarding_complete", False),
        "preferences": user.get("preferences", {}),
    }


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest):
    db = get_db()
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    doc = {
        "name": payload.name,
        "age": payload.age,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "guest_id": None,
        "region": payload.region,
        "preferences": {
            "movie_languages": [],
            "music_languages": [],
            "favourite_genres": [],
            "favourite_artists": [],
            "favourite_book_genres": [],
            "favourite_authors": [],
        },
        "is_guest": False,
        "onboarding_complete": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token(subject=str(result.inserted_id), is_guest=False)
    return TokenResponse(access_token=token, is_guest=False, user=_public_user(doc))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": payload.email})
    if not user or not user.get("hashed_password") or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(subject=str(user["_id"]), is_guest=False)
    return TokenResponse(access_token=token, is_guest=False, user=_public_user(user))


@router.post("/guest", response_model=TokenResponse)
async def start_guest(payload: GuestStartRequest):
    """Guest mode: no email/password required, fully usable app."""
    db = get_db()
    guest_id = new_guest_id()

    doc = {
        "name": payload.name,
        "age": payload.age,
        "email": None,
        "hashed_password": None,
        "guest_id": guest_id,
        "region": payload.region,
        "preferences": {
            "movie_languages": [],
            "music_languages": [],
            "favourite_genres": [],
            "favourite_artists": [],
            "favourite_book_genres": [],
            "favourite_authors": [],
        },
        "is_guest": True,
        "onboarding_complete": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token(subject=guest_id, is_guest=True)
    return TokenResponse(access_token=token, is_guest=True, user=_public_user(doc))


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return _public_user(current_user)
