🏙️ Civic Sense
A civic issue reporting platform where citizens report infrastructure problems — potholes, garbage, broken streetlights — and an AI service automatically prioritizes and routes each report to the correct city department.

Built with a real RAG pipeline. Not a wrapper around a prompt.


Architecture — 3 Services
Citizen / Admin (React Native + Expo)
            │
            ▼
    Backend  :5001  (Node.js + Express 5 + MongoDB)
            │
            │  POST /prioritize  →  AI Service  :5002
            │  ← { priority_score, reasoning,      │
            │      community_id, community_name }   │
            │                                       │
            │                         Flask + LangChain + Groq
            │                         ChromaDB (local)
            │                         sentence-transformers
            ▼
        MongoDB

How It Works End-to-End
Citizen submits report (title, description, photos, location)
        │
        ▼
Backend → POST /prioritize → AI Service
        │    ← { priority_score, reasoning, community_id, community_name }
        │
        ├── maps score (1–10) → Low / Medium / High
        ├── assigns Department in MongoDB
        └── gives citizen +10 points (gamification)

Admin sees pre-routed, pre-prioritized report in dashboard
Admin updates status → citizen earns +20 more points

RAG Pipeline (AI Service)
The AI service runs a real retrieval-augmented generation pipeline using LCEL — not a hardcoded prompt with department names.
Before (what it was):

9 department names hardcoded as a string inside the prompt
json.loads() + manual ``` fence stripping to parse LLM output
LangChain used only as a thin wrapper around llm.invoke(prompt)
No retrieval, no vector store, no embeddings

After (what it is now):
StepImplementationKnowledge base9 department documents embedded into ChromaDBRetrievalretriever.invoke() — semantic similarity, top-3 departments per reportChainLCEL: {context: retriever | format_docs, report: passthrough} | PROMPT | structured_llmOutput parsingllm.with_structured_output(PriorityResult) — Pydantic schema, no manual JSON parsingLLMGroq llama-3.3-70b-versatile — fast, generous free tierEmbeddingssentence-transformers/all-MiniLM-L6-v2 — local, no API key, no rate limits

Tech Stack
ServiceStackFrontendReact Native · Expo 54 · Expo Router · Google OAuth 2.0 · JWTBackendNode.js · Express 5 · MongoDB · Passport.jsAI ServicePython Flask · LangChain · LangChain-Groq · ChromaDB · sentence-transformers · Pydantic

Gamification
ActionPointsSubmit a report+10Report resolved by admin+20
Citizens accumulate points across submissions. Designed to incentivize reporting quality infrastructure issues over spam.

Services
Frontend — React Native + Expo 54

Expo Router for navigation
Google OAuth 2.0 + JWT auth
Citizens: submit reports with title, description, photos, location
Admins: dashboard showing pre-routed, pre-prioritized reports by department
Status tracking per report

Backend — Node.js :5001

Express 5 + MongoDB + Passport.js
Calls AI service POST /prioritize on every new report submission
Maps priority_score (1–10) → Low / Medium / High
Assigns department from AI response
Handles points allocation on submission and resolution
/prioritize contract unchanged from original — no frontend or backend changes needed after AI service rewrite

AI Service — Flask :5002

Single endpoint: POST /prioritize
Input: { title, description }
Output: { priority_score, reasoning, community_id, community_name }
ChromaDB knowledge base built at startup from 9 department documents
LCEL chain runs on every request


Setup
AI Service
bashcd ai-service
pip install flask langchain langchain-community langchain-groq \
            sentence-transformers chromadb pydantic python-dotenv
.env:
envGROQ_API_KEY=gsk_...
CHROMA_DB_DIR=./chroma_store
bashpython app.py    # starts on :5002
Backend
bashcd backend
npm install
.env:
envMONGODB_URI=mongodb://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AI_SERVICE_URL=http://localhost:5002
PORT=5001
bashnpm run dev    # starts on :5001
Frontend
bashcd frontend
npm install
npx expo start

Folder Structure
civic-sense/
├── frontend/          ← React Native + Expo 54 + Expo Router
├── backend/           ← Node.js + Express 5 + MongoDB
│   └── routes/
│       ├── auth.js
│       ├── reports.js
│       └── admin.js
└── ai-service/        ← Flask + LangChain + ChromaDB
    ├── app.py         ← Flask server + LCEL chain
    ├── config.py      ← GROQ_API_KEY + CHROMA_DB_DIR
    └── requirements.txt

Verified End-to-End
Both retrieval and the full chain were tested locally and produced correct results:
"Pothole on highway near school, cars damaged"
→ Priority 8 · Public Works Department

"Garbage uncollected for 2 weeks near residential area"
→ Priority 6 · Sanitation Department
