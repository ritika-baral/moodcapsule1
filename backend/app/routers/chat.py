import json
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.db.mongodb import get_db
from app.schemas.chat import ChatMessageRequest, OnboardingRequest
from app.services import gemini_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/greeting")
async def greeting():
    """A short warm AI greeting shown the moment the conversation screen opens."""
    text = await gemini_service.generate_greeting()
    return {"greeting": text}


@router.post("/onboarding")
async def submit_onboarding(payload: OnboardingRequest, current_user: dict = Depends(get_current_user)):
    """Saves name/age/preferences collected via the onboarding form."""
    db = get_db()
    user_filter = (
        {"guest_id": current_user["guest_id"]} if current_user.get("is_guest") else {"_id": ObjectId(current_user["_id"])}
    )

    update = {
        "name": payload.name,
        "age": payload.age,
        "region": payload.region,
        "preferences": payload.preferences.model_dump(),
        "onboarding_complete": True,
        "updated_at": datetime.now(timezone.utc),
    }
    await db.users.update_one(user_filter, {"$set": update})
    return {"status": "ok", "preferences": update["preferences"]}


@router.post("/session")
async def create_session(current_user: dict = Depends(get_current_user)):
    """Starts a fresh mood session (a single conversation + its eventual recommendations/capsule)."""
    db = get_db()
    doc = {
        "user_id": current_user["_id"] if not current_user.get("is_guest") else current_user["guest_id"],
        "conversation": [],
        "detected_mood": None,
        "category": None,
        "recommendations": {},
        "mood_capsule": None,
        "saved": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.mood_sessions.insert_one(doc)
    return {"session_id": str(result.inserted_id)}


async def _get_session(db, session_id: str, user_key: str) -> dict:
    try:
        session = await db.mood_sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        session = None
    if not session or session.get("user_id") != user_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def _user_key(user: dict) -> str:
    return user["guest_id"] if user.get("is_guest") else user["_id"]


@router.post("/message")
async def send_message(payload: ChatMessageRequest, current_user: dict = Depends(get_current_user)):
    """
    Streams Gemini's reply via Server-Sent Events while the mood conversation happens.
    The full conversation (including this new user turn) is persisted to the session.
    """
    db = get_db()
    user_key = _user_key(current_user)

    if payload.session_id:
        session = await _get_session(db, payload.session_id, user_key)
        session_id = payload.session_id
    else:
        doc = {
            "user_id": user_key,
            "conversation": [],
            "detected_mood": None,
            "category": None,
            "recommendations": {},
            "mood_capsule": None,
            "saved": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await db.mood_sessions.insert_one(doc)
        session_id = str(result.inserted_id)
        session = doc

    conversation = session.get("conversation", [])
    conversation.append({"role": "user", "content": payload.message, "timestamp": datetime.now(timezone.utc)})

    user_profile = {
        "name": current_user.get("name"),
        "age": current_user.get("age"),
        "region": current_user.get("region"),
        "preferences": current_user.get("preferences", {}),
    }

    chat_history = [{"role": t["role"], "content": t["content"]} for t in conversation]

    async def event_stream():
        full_reply = ""
        yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"
        try:
            async for chunk in gemini_service.stream_chat_reply(chat_history, user_profile):
                full_reply += chunk
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
        except Exception as exc:
            yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n"
            return

        conversation.append(
            {"role": "assistant", "content": full_reply, "timestamp": datetime.now(timezone.utc)}
        )
        await db.mood_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"conversation": conversation, "updated_at": datetime.now(timezone.utc)}},
        )
        yield f"event: done\ndata: {json.dumps({'full_text': full_reply})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    session = await _get_session(db, session_id, _user_key(current_user))
    session["_id"] = str(session["_id"])
    return session
