import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo
from app.routers import auth, capsule, chat, recommendations, saved

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mood_capsule")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    logger.info("Mood Capsule API started (%s)", settings.APP_ENV)
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Mood Capsule API",
    description="AI-powered, mood-aware recommendation platform, backed by Google Gemini.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the Vite dev server / deployed frontend origin only — never '*'
# alongside credentials, and never expose this configuration to the client.
allowed_origins = [settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(allowed_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(recommendations.router)
app.include_router(capsule.router)
app.include_router(saved.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mood-capsule-api"}
