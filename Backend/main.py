"""FastAPI backend for Lindle MVP (with PDF download) - Refactored version.

This refactored version separates concerns into:
- Models: Data structures 
- Services: Business logic (file processing, OpenAI, PDF generation)
- Routes: API endpoints

Run with Docker:
  docker build -t lindle-backend .
  docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... lindle-backend

Run locally:
  python3 -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  export OPENAI_API_KEY=sk-...
  # optional if you use an sk-proj key:
  export OPENAI_PROJECT=proj_...
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.health import router as health_router
from routes.analysis import router as analysis_router
from routes.vault import router as vault_router



# ---------- FastAPI ----------
app = FastAPI(title="Lindle MVP API", version="0.4")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, tags=["Health"])
app.include_router(analysis_router, tags=["Analysis"])
app.include_router(vault_router, tags=["Vault"])