"""Health and status routes."""

import os
from fastapi import APIRouter

# Import model configuration
from services.openai_service import MODEL

router = APIRouter()


@router.get("/")
async def root():
    """API status and version endpoint."""
    return {"ok": True, "name": "Lindle MVP API", "version": "0.4"}


@router.get("/health")
async def health():
    """Health check with OpenAI configuration status."""
    return {
        "ok": True,
        "has_key": bool(os.getenv("OPENAI_API_KEY")),
        "project": bool(os.getenv("OPENAI_PROJECT")),
        "model": MODEL,
    }