# ✨ Mood Capsule

**Built around your mood. Refined by your taste.**

Mood Capsule is a generative-AI recommendation platform that has a real conversation with you, understands
how you're feeling *right now*, and recommends movies, shows, music, books, podcasts, activities, journal
prompts, quotes and games that actually fit the moment — not just your watch history.

Unlike a typical recommender, every suggestion is reasoned through in this priority order:

1. **Safety** — age-appropriate content, always
2. **Current emotional state** — read from the live conversation, not keywords
3. **Existing preferences** — languages, genres, artists, authors you've told it about
4. **Language / region** — your preferred language comes first
5. **Diversity** — no five near-identical picks
6. **Gentle exploration** — a clearly separate "you might also enjoy exploring…" section

At the end of every session you get a **Mood Capsule** — a short, poetic, shareable artifact describing
today's vibe, without any clinical scoring.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Framer Motion, React Router, Axios, React Hook Form, Lucide Icons |
| Backend | Python FastAPI, Uvicorn |
| Database | MongoDB Atlas via Motor (async driver) |
| Auth | JWT (email/password) + Guest Mode |
| GenAI | Google Gemini API (free tier) — streamed conversational replies + structured JSON reasoning for recommendations & the Mood Capsule |
| Enrichment | TMDB (movies/TV posters & ratings), Google Books (covers), Spotify Web API (album art), Listen Notes (podcasts, optional) |
| Infra | Docker, AWS App Runner |
| State | React Context API |

All third-party API calls happen **only** from the backend. The frontend never sees an API key.

---

## Project structure

```
mood-capsule/
├── backend/
│   ├── app/
│   │   ├── core/            # settings, JWT/security
│   │   ├── db/               # Motor/MongoDB connection
│   │   ├── models/           # Pydantic document models (Users, MoodSessions, SavedRecommendations)
│   │   ├── schemas/          # request/response DTOs
│   │   ├── routers/          # auth, chat, recommendations, capsule, saved
│   │   ├── services/         # gemini_service, tmdb/books/spotify/podcast services, recommendation_engine
│   │   ├── utils/            # auth dependency (JWT -> current user, incl. guests)
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/               # axios instance + endpoint wrappers
│   │   ├── components/        # landing / chat / recommendations / capsule / common
│   │   ├── context/           # AuthContext, ChatContext
│   │   ├── hooks/             # useStreamChat (SSE streaming)
│   │   ├── pages/              # Landing, Start, Conversation, SavedCapsules
│   │   └── utils/constants.js
│   ├── Dockerfile              # multi-stage build -> nginx
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## How the conversation flow works

1. **Landing** → *Start Conversation*
2. **Start** — name, age (for age-appropriate content) and either Guest Mode or a real account (JWT).
3. **Taste check** — a short React-Hook-Form-validated step for movie/music languages, genres, favourite
   artists/authors. Stored on the user document.
4. **Mood conversation** — a Gemini-powered chat, streamed token-by-token over Server-Sent Events. Auto
   prompt suggestions ("I'm feeling stressed today.", "Surprise me.", …) are one tap away.
5. **Category picker** — Movies, TV Shows, Music, Books, Podcasts, Activities, Journal Prompts, Quotes,
   Games, or the premium **✨ Build My Capsule** (all categories at once).
6. **Recommendations** — reasoned by Gemini using the priority order above, then enriched with real posters
   / covers / album art from TMDB, Google Books and Spotify. Movies/TV/Music get a second
   *"You might also enjoy exploring…"* section for content outside the user's usual language/genre.
7. **Mood Capsule** — a poetic, literal pill-shaped card with *Today's Vibe*, *What You're Looking For*,
   *Your Emotional Weather* and *Today's AI Thought*. Shareable as copyable text, savable to MongoDB.
8. **Keep talking** — the same streaming chat stays available; refinement chips (*Something different*,
   *Less emotional*, *More comforting*, *More exciting*) regenerate both the recommendations and the capsule.

---

## MongoDB collections

- **users** — name, age, email/guest_id, region, `preferences` (movie/music languages, genres, artists,
  book genres, authors), `onboarding_complete`.
- **mood_sessions** — `user_id`, full `conversation` transcript, selected `category`, `recommendations`,
  `mood_capsule`, `saved` flag, timestamps.
- **saved_recommendations** — `user_id`, `session_id`, `category`, the saved `recommendation` object,
  `timestamp`.

---

## Running locally

### Option A — Docker Compose (recommended, includes a local Mongo container)

```bash
cp backend/.env.example backend/.env      # fill in GEMINI_API_KEY at minimum
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (docs at `/docs`)

### Option B — Run each service manually

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys + a MongoDB Atlas URI
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | JWT signing secret — generate a long random string |
| `MONGODB_URI` / `MONGODB_DB_NAME` | MongoDB Atlas connection string |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Google Gemini API access (free tier via [Google AI Studio](https://aistudio.google.com/apikey)) |
| `TMDB_API_KEY` | themoviedb.org — movie/TV posters, ratings |
| `GOOGLE_BOOKS_API_KEY` | Google Books — book covers (works without a key too, rate-limited) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify Web API client-credentials flow — album art |
| `LISTEN_NOTES_API_KEY` | optional — podcast metadata |
| `FRONTEND_ORIGIN` | allowed CORS origin for the deployed frontend |

The app degrades gracefully if an enrichment key (TMDB/Books/Spotify/Listen Notes) is missing — Gemini's
reasoning still returns the recommendation, just without real poster art.

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | URL of the FastAPI backend |

---

## Deployment — Docker + AWS App Runner

Each service ships its own production `Dockerfile` and is deployed as its **own App Runner service**.

1. **Build & push images to Amazon ECR**
   ```bash
   aws ecr create-repository --repository-name mood-capsule-backend
   aws ecr create-repository --repository-name mood-capsule-frontend

   docker build -t mood-capsule-backend ./backend
   docker build -t mood-capsule-frontend --build-arg VITE_API_BASE_URL=https://<backend-url> ./frontend

   # tag + docker push to each ECR repo (see AWS docs for the login/tag commands)
   ```
2. **Create the backend App Runner service** from the ECR image, port `8000`, and set all backend env vars
   (from the table above) as App Runner environment variables/secrets.
3. **Create the frontend App Runner service** from the ECR image, port `80`. Since Vite bakes
   `VITE_API_BASE_URL` in at *build* time, make sure it was passed as a `--build-arg` pointing at the
   backend's real App Runner URL before pushing the image.
4. Both services get a public HTTPS URL from App Runner automatically. Set the backend's
   `FRONTEND_ORIGIN` to the frontend's App Runner URL for CORS.

`backend/apprunner.yaml` and `frontend/apprunner.yaml` are included as an alternative source-based deploy
path (no Docker image build required) if you connect the repo directly to App Runner instead.

---

## Notes on the Gemini integration

Mood Capsule uses the [Google Gen AI SDK](https://github.com/googleapis/python-genai) (`google-genai`) against
the **Gemini Developer API**, which has a free tier — no billing account required to get started.

1. Grab a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set `GEMINI_API_KEY` in `backend/.env`.
3. (Optional) Set `GEMINI_MODEL` — defaults to `gemini-2.5-flash`, a fast, free-tier-friendly model.
   `gemini-2.0-flash` is a solid lower-cost alternative if you hit free-tier rate limits.

Implementation details:

- **Streaming**: `/api/chat/message` streams Gemini's conversational reply as Server-Sent Events, using
  `client.aio.models.generate_content_stream(...)` and forwarding each `chunk.text` to the client as it
  arrives, so the UI can render token-by-token instead of waiting for the full response.
- **Structured reasoning, not keyword matching**: recommendation and Mood Capsule generation prompt Gemini
  to return strict JSON (enforced via `response_mime_type="application/json"` in `GenerateContentConfig`),
  reasoning over the full conversation + stored preferences + age, in the mandated priority order — never a
  keyword lookup table.
- **Conversation roles**: Gemini's multi-turn `contents` use `role="model"` for the AI's turns (not
  `"assistant"`) — `gemini_service._to_gemini_contents()` translates our internal conversation format
  accordingly before every call.
- **Safety-first**: every system prompt (passed via `GenerateContentConfig.system_instruction`) embeds an
  age-derived safety clause before anything else is asked of the model.
- **Graceful JSON parsing**: `gemini_service._extract_json()` defensively strips any stray markdown fences
  before parsing, in case a future model revision wraps its JSON output.
