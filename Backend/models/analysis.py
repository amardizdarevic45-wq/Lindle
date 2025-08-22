"""Analysis response model for contract analysis."""

from typing import List, Optional
from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    """Response model for contract analysis results."""
    summary: str
    red_flags: List[str]
    pushbacks: List[str]
    tokens_used: Optional[int] = None