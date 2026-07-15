from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.mongodb import get_db
from app.schemas.recommendation import RecommendationRequest, VALID_CATEGORIES
from app.services import recommendation_engine
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


def _user_key(user: dict) -> str:
    return user["guest_id"] if user.get("is_guest") else user["_id"]


@router.post("")
async def get_recommendations(payload: RecommendationRequest, current_user: dict = Depends(get_current_user)):
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown category")

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

    if payload.category == "build_my_capsule":
        result = await recommendation_engine.build_full_capsule(conversation, user_profile, payload.refinement)
    else:
        result = await recommendation_engine.build_category_recommendations(
            payload.category, conversation, user_profile, payload.refinement
        )

    await db.mood_sessions.update_one(
        {"_id": ObjectId(payload.session_id)},
        {
            "$set": {
                "category": payload.category,
                "recommendations": result,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {"session_id": payload.session_id, "category": payload.category, "result": result}
