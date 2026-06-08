## Repo quick orientation

This repository contains three primary components:

- backend/: Express + Mongoose API server (session & Passport auth). Main entry: `backend/server.js`.
- frontend/: Expo / React Native app using `expo-router` (run with `npm run start`). Main config: `frontend/package.json` and `app/` folder.
- ai_service/: Small AI microservice (calls Google Gemini via `langchain_google_genai`). Main entry: `ai_service/app.py`.

Keep in mind: the frontend is a mobile/Expo app, the backend is a Node API that expects a MongoDB connection, and the AI service runs separately (default port 5002) and is called synchronously by the backend.

## Quick dev start (how developers run things)

- Backend (requires `.env` with MONGO_URI, SESSION_SECRET, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, GOOGLE_CALLBACK_URL):
  - cd backend
  - npm install (if needed)
  - npm run dev (runs `nodemon server.js`, default port 5001)

- Frontend (Expo):
  - cd frontend
  - npm install
  - npm run start (opens Expo)
  - Useful script: `npm run reset-project` runs `scripts/reset-project.js`.

- AI service:
  - cd ai_service
  - Create and activate a Python venv, then `pip install -r requirements.txt` (see note below)
  - Set `GEMINI_API_KEY` in `ai_service/.env` or environment
  - `python app.py` (service listens on port 5002 by default)

Note: `ai_service/requirements.txt` lists FastAPI/uvicorn but `ai_service/app.py` is implemented with Flask. Prefer creating a venv and `pip install flask pydantic python-dotenv` plus the packages listed; `app.py` is runnable as-is.

## Important runtime contracts and integration points

- Backend mounts these top-level routers (see `backend/server.js`):
  - `/auth` -> `backend/routes/authRoutes.js`
  - `/reports` -> `backend/routes/reportRoutes.js` (controllers in `backend/controllers/reportController.js`)
  - `/departments`, `/posts`, `/user`

- Auth:
  - Passport local strategy (email + password) and Google OAuth are configured in `backend/config/passport.js`.
  - Server uses cookie sessions (`express-session`). Some routes return JWT for mobile flows (see `/auth/google/callback`).

- AI integration:
  - `backend/controllers/reportController.js` calls the AI service at `http://localhost:5002/prioritize` to obtain a `priority_score` and `community_name`.
  - The AI microservice returns JSON in the shape { priority_score, reasoning, community_id, community_name } (see `ai_service/app.py`).

- Geo and data shapes:
  - Locations are stored as GeoJSON Points: { type: "Point", coordinates: [longitude, latitude] }.
  - Admin users may have `location` (Point) and `departmentId` fields; admin queries use `$geoWithin` queries in `reportController.js`.

- Report lifecycle:
  - Status transitions enforced in `reportController.js` (e.g. New → In Progress → Resolved → Closed). Follow `validTransitions` when changing status.

## Useful examples for tests/patches

- Create report (example POST to backend):
  - POST http://localhost:5001/reports with JSON body:
    {
      "title": "Pothole on Main",
      "description": "Large pothole near school",
      "category": "Road",
      "location": { "type": "Point", "coordinates": [-122.42, 37.77] }
    }
  - Backend will call AI service at /prioritize. If AI returns a community, backend will try to map it to `Department.name`.

- Auth flow to inspect:
  - Local login uses Passport Local (email + password); see `backend/routes/authRoutes.js` and `backend/config/passport.js`.
  - Google OAuth callback returns a JWT: `/auth/google/callback`.

## Repo-specific conventions and gotchas

- Mixed paradigms: backend uses session-based Passport + JWT in some OAuth flows — be careful when adding auth middleware or changing session handling.
- AI service mismatch: `ai_service/requirements.txt` mentions FastAPI/uvicorn, but `app.py` uses Flask. If changing the AI service, update requirements and dev run instructions accordingly.
- DB expectations:
  - Backend expects a MongoDB instance (MONGO_URI).
  - AI service includes a local Chroma DB at `ai_service/chroma_db/chroma.sqlite3` and `ai_service/db/` — avoid deleting these unless you intend to recreate the embeddings.

## Key files to inspect when modifying behavior

- `backend/server.js` — router mounting, middleware, global error handler
- `backend/config/passport.js` — local and Google OAuth strategies
- `backend/controllers/reportController.js` — AI call, geo queries, report lifecycle rules
- `backend/routes/authRoutes.js` — register/login flow and Google OAuth handling
- `ai_service/app.py` and `ai_service/config.py` — how AI prompts & LLM are invoked and parsed
- `frontend/package.json` and `frontend/app/` — Expo routing and screens; useful when changing API surface or auth UX

## How to debug quickly

- Backend: logs on startup indicate MongoDB connection success. Use `console.log` at controller entry points to inspect incoming payloads.
- AI service: it prints the parsed JSON from the LLM (`print(parsed)`) — check stdout when running `python app.py`.
- Network: backend calls AI at `http://localhost:5002`; ensure both backend and ai_service are running and ports are not blocked.

## When adding or modifying endpoints

- Preserve the current data shapes (GeoJSON points, report status enum). Update `reportController.js` and add corresponding unit/integration tests in a new `tests/` folder if appropriate.

---
If any section is unclear or you want the file to include more examples (curl commands, environment templates, or a troubleshooting checklist), tell me which parts to expand and I'll iterate. 
