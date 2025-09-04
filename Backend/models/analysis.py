"""Analysis response model for contract analysis."""

from typing import List, Optional
from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    """Response model for contract analysis results."""
    summary: str
    red_flags: List[str]
    pushbacks: List[str]
    tokens_used: Optional[int] = None
    counterparty: Optional[str] = None
    counterparty_type: Optional[str] = None
    industry: Optional[str] = None
    gcs_file_path: Optional[str] = None
    gcs_file_url: Optional[str] = None
    contract_id: Optional[str] = None
    extracted_text: Optional[str] = None
    extracted_clauses: Optional[List[str]] = None