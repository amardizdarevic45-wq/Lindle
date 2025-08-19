"""Contract analysis routes."""

import io
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from models.analysis import AnalysisResponse
from services.file_processor import extract_text_from_file
from services.openai_service import analyze_contract
from services.pdf_service import generate_analysis_pdf

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    """Analyze contract and return JSON response."""
    content = await file.read()
    text = extract_text_from_file(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")
    return analyze_contract(text, role=role, risk=risk_tolerance)


@router.post("/analyze_pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    """Analyze contract and return downloadable PDF report."""
    content = await file.read()
    text = extract_text_from_file(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")

    result = analyze_contract(text, role=role, risk=risk_tolerance)
    pdf_bytes = generate_analysis_pdf(result.summary, result.red_flags, result.pushbacks)
    headers = {"Content-Disposition": "attachment; filename=contract_analysis.pdf"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)