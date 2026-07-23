from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.mongodb import get_db
from app.services import gemini_service, recommendation_engine
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/capsule", tags=["capsule"])


class CapsuleRequest(BaseModel):
    session_id: str


def _user_key(user: dict) -> str:
    return user["guest_id"] if user.get("is_guest") else user["_id"]


@router.post("/generate")
async def generate_capsule(payload: CapsuleRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        session = await db.mood_sessions.find_one({"_id": ObjectId(payload.session_id)})
    except Exception:
        session = None
    if not session or session.get("user_id") != _user_key(current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    conversation = [{"role": t["role"], "content": t["content"]} for t in session.get("conversation", [])]
    user_profile = {
        "name": current_user.get("name"),
        "age": current_user.get("age"),
        "region": current_user.get("region"),
        "preferences": current_user.get("preferences", {}),
    }
    summary = recommendation_engine.summarize_for_capsule(session.get("recommendations", {}))

    capsule = await gemini_service.generate_mood_capsule(conversation, user_profile, summary)

    await db.mood_sessions.update_one(
        {"_id": ObjectId(payload.session_id)},
        {"$set": {"mood_capsule": capsule, "updated_at": datetime.now(timezone.utc)}},
    )

    return {"session_id": payload.session_id, "mood_capsule": capsule}


@router.post("/{session_id}/save")
async def save_capsule(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        session = await db.mood_sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        session = None
    if not session or session.get("user_id") != _user_key(current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    await db.mood_sessions.update_one(
        {"_id": ObjectId(session_id)}, {"$set": {"saved": True, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"status": "saved"}
