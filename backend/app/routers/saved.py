from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.mongodb import get_db
from app.schemas.recommendation import SaveRecommendationRequest
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/saved", tags=["saved"])


def _user_key(user: dict) -> str:
    return user["guest_id"] if user.get("is_guest") else user["_id"]


@router.post("/recommendation")
async def save_recommendation(payload: SaveRecommendationRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "user_id": _user_key(current_user),
        "session_id": payload.session_id,
        "category": payload.category,
        "recommendation": payload.recommendation,
        "timestamp": datetime.now(timezone.utc),
    }
    result = await db.saved_recommendations.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.get("/recommendations")
async def list_saved_recommendations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.saved_recommendations.find({"user_id": _user_key(current_user)}).sort("timestamp", -1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"items": items}


@router.delete("/recommendation/{rec_id}")
async def delete_saved_recommendation(rec_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(rec_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid id")

    result = await db.saved_recommendations.delete_one({"_id": oid, "user_id": _user_key(current_user)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return {"status": "deleted"}


@router.get("/capsules")
async def list_saved_capsules(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.mood_sessions.find({"user_id": _user_key(current_user), "saved": True}).sort("created_at", -1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return {"items": items}
