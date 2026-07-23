import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger("mood_capsule.db")


class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongodb = MongoDB()


async def connect_to_mongo() -> None:
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URI, uuidRepresentation="standard")
    mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
    try:
        await mongodb.client.admin.command("ping")
        logger.info("Connected to MongoDB Atlas (%s)", settings.MONGODB_DB_NAME)
    except Exception as exc:  # pragma: no cover
        logger.warning("MongoDB connection check failed: %s", exc)

    await _ensure_indexes()


async def close_mongo_connection() -> None:
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed")


async def _ensure_indexes() -> None:
    db = mongodb.db
    if db is None:
        return
    await db.users.create_index("email", unique=True, sparse=True)
    await db.users.create_index("guest_id", unique=True, sparse=True)
    await db.mood_sessions.create_index([("user_id", 1), ("created_at", -1)])
    await db.saved_recommendations.create_index([("user_id", 1), ("category", 1)])


def get_db() -> AsyncIOMotorDatabase:
    if mongodb.db is None:
        raise RuntimeError("Database not initialized yet")
    return mongodb.db
