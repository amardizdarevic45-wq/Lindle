"""Contract analysis routes."""

import io
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime

from models.analysis import AnalysisResponse
from services.file_processor import extract_text_from_file
from services.openai_service import analyze_contract
from services.pdf_service import generate_analysis_pdf
from services.firebase_service import db

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


@router.post("/analyze_with_user")
async def analyze_with_user(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    """Analyze contract and save to Firebase for the specified user."""
    content = await file.read()
    text = extract_text_from_file(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")

    result = analyze_contract(text, role=role, risk=risk_tolerance)
    
    # Save contract to Firebase
    if db:
        try:
            contract_data = {
                'userId': user_id,
                'fileName': file.filename,
                'summary': result.summary,
                'redFlags': result.red_flags,
                'pushbacks': result.pushbacks,
                'role': role,
                'riskTolerance': risk_tolerance,
                'status': 'draft',
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            contracts_ref = db.collection('contracts')
            doc_ref = contracts_ref.add(contract_data)
            
            # Add the document ID to the response
            result_dict = result.dict()
            result_dict['contract_id'] = doc_ref[1].id
            
            return result_dict
        except Exception as e:
            print(f"Error saving contract to Firebase: {e}")
            # Return the analysis result even if saving fails
            return result.dict()
    else:
        # Return the analysis result if Firebase is not available
        return result.dict()