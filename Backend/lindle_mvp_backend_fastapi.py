# lindle_mvp_backend_fastapi.py
# FastAPI backend for Lindle MVP (with PDF download)
# - Upload PDF/DOCX/TXT
# - Extract text
# - OpenAI summary, red_flags, pushbacks (works with sk- and sk-proj- keys)
# - /analyze returns JSON
# - /analyze_pdf returns a downloadable PDF
#
# Run locally:
#   python3 -m venv .venv && source .venv/bin/activate
#   pip install -U fastapi uvicorn python-multipart pydantic openai PyMuPDF python-docx reportlab
#   export OPENAI_API_KEY=sk-...
#   # optional if you use an sk-proj key:
#   export OPENAI_PROJECT=proj_...
#   uvicorn lindle_mvp_backend_fastapi:app --reload

from __future__ import annotations

import io
import json
import os
import re
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ---------- OpenAI client ----------
try:
    from openai import OpenAI
except Exception as e:
    raise RuntimeError("OpenAI SDK not installed. Run: pip install openai")

_API_KEY = os.getenv("OPENAI_API_KEY")
_PROJECT = os.getenv("OPENAI_PROJECT")  # optional for sk-proj keys
client = OpenAI(api_key=_API_KEY, project=_PROJECT) if _PROJECT else OpenAI(api_key=_API_KEY)

# ---------- Google Cloud Storage ----------
try:
    from services.gcs_service import gcs_service
except Exception as e:
    print(f"Warning: GCS service not available: {e}")
    gcs_service = None

# ---------- FastAPI ----------
app = FastAPI(title="Lindle MVP API", version="0.4")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class AnalysisResponse(BaseModel):
    summary: str
    red_flags: List[str]
    pushbacks: List[str]
    tokens_used: Optional[int] = None
    counterparty: Optional[str] = None
    counterparty_type: Optional[str] = None
    industry: Optional[str] = None

# Reputation Tracker Models
class Entity(BaseModel):
    id: str
    name: str
    entity_type: str  # "client" or "vendor" 
    industry: Optional[str] = None
    contact_info: Optional[str] = None
    reputation_score: float = 0.0
    total_contracts: int = 0
    created_at: str
    updated_at: str

class ContractOutcome(BaseModel):
    id: str
    entity_id: str
    contract_filename: str
    outcome: str  # "Successful Completion", "Early Termination", "Dispute", "Litigation", "Pending"
    contract_summary: str
    red_flags_count: int
    pushbacks_count: int
    role: str
    risk_tolerance: str
    created_at: str
    updated_at: str
    notes: Optional[str] = None

class ReputationSummary(BaseModel):
    entity: Entity
    contracts: List[ContractOutcome]
    performance_metrics: dict

# ---------- Data Storage ----------
DATA_DIR = "data"
ENTITIES_FILE = os.path.join(DATA_DIR, "entities.json")
CONTRACTS_FILE = os.path.join(DATA_DIR, "contracts.json")

def ensure_data_dir():
    """Ensure data directory exists"""
    os.makedirs(DATA_DIR, exist_ok=True)

def load_entities() -> List[Entity]:
    """Load entities from JSON file"""
    ensure_data_dir()
    if not os.path.exists(ENTITIES_FILE):
        return []
    try:
        with open(ENTITIES_FILE, 'r') as f:
            data = json.load(f)
            return [Entity(**entity) for entity in data]
    except Exception:
        return []

def save_entities(entities: List[Entity]):
    """Save entities to JSON file"""
    ensure_data_dir()
    with open(ENTITIES_FILE, 'w') as f:
        json.dump([entity.dict() for entity in entities], f, indent=2)

def load_contracts() -> List[ContractOutcome]:
    """Load contracts from JSON file"""
    ensure_data_dir()
    if not os.path.exists(CONTRACTS_FILE):
        return []
    try:
        with open(CONTRACTS_FILE, 'r') as f:
            data = json.load(f)
            return [ContractOutcome(**contract) for contract in data]
    except Exception:
        return []

def save_contracts(contracts: List[ContractOutcome]):
    """Save contracts to JSON file"""
    ensure_data_dir()
    with open(CONTRACTS_FILE, 'w') as f:
        json.dump([contract.dict() for contract in contracts], f, indent=2)

def find_or_create_entity(name: str, entity_type: str, industry: str = None) -> Entity:
    """Find existing entity or create a new one"""
    entities = load_entities()
    
    # Try to find existing entity (case-insensitive)
    for entity in entities:
        if entity.name.lower() == name.lower():
            return entity
    
    # Create new entity
    entity_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    new_entity = Entity(
        id=entity_id,
        name=name,
        entity_type=entity_type,
        industry=industry,
        reputation_score=0.0,
        total_contracts=0,
        created_at=now,
        updated_at=now
    )
    
    entities.append(new_entity)
    save_entities(entities)
    return new_entity

def calculate_reputation_score(entity_id: str) -> float:
    """Calculate reputation score based on contract outcomes"""
    contracts = load_contracts()
    entity_contracts = [c for c in contracts if c.entity_id == entity_id]
    
    if not entity_contracts:
        return 0.0
    
    # Simple scoring algorithm
    score = 0.0
    for contract in entity_contracts:
        if contract.outcome == "Successful Completion":
            score += 10
        elif contract.outcome == "Pending":
            score += 5
        elif contract.outcome == "Early Termination":
            score -= 3
        elif contract.outcome == "Dispute":
            score -= 7
        elif contract.outcome == "Litigation":
            score -= 15
        
        # Adjust for red flags (more red flags = lower score)
        score -= contract.red_flags_count * 0.5
    
    # Normalize to 0-100 scale
    max_possible = len(entity_contracts) * 10
    if max_possible > 0:
        score = max(0, min(100, (score / max_possible) * 100))
    
    return round(score, 1)

def update_entity_reputation(entity_id: str):
    """Update entity's reputation score and contract count"""
    entities = load_entities()
    contracts = load_contracts()
    
    for entity in entities:
        if entity.id == entity_id:
            entity.reputation_score = calculate_reputation_score(entity_id)
            entity.total_contracts = len([c for c in contracts if c.entity_id == entity_id])
            entity.updated_at = datetime.utcnow().isoformat()
            break
    
    save_entities(entities)

# ---------- File extraction ----------
SUPPORTED_EXTS = {"pdf", "docx", "txt"}


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    import fitz  # PyMuPDF
    text_parts: List[str] = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text("text") or "")
    return "\n".join(text_parts).strip()


def _extract_text_from_docx(file_bytes: bytes) -> str:
    import docx
    f = io.BytesIO(file_bytes)
    document = docx.Document(f)
    return "\n".join(p.text for p in document.paragraphs).strip()


def _sniff_and_extract(filename: str, content: bytes) -> str:
    ext = (filename.split(".")[-1] or "").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}. Use PDF, DOCX, or TXT.")
    try:
        if ext == "pdf":
            return _extract_text_from_pdf(content)
        if ext == "docx":
            return _extract_text_from_docx(content)
        return content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read {ext.upper()} file: {e}")

# ---------- OpenAI prompts ----------
SYSTEM_PROMPT = (
    "You are Lindle, a concise contract assistant for people who RECEIVE contracts they didn't write. "
    "Use plain, non-legalese language. You do not provide legal advice; you provide educational guidance."
)

USER_PROMPT_TEMPLATE = (
    "ROLE: {role}\nRISK_TOLERANCE: {risk}\n\n"
    "TASKS:\n"
    "1) SUMMARY (<= 180 words): Briefly explain parties, scope, payment, term, obligations.\n"
    "2) RED_FLAGS (5 bullets): Most material risks for the ROLE; name clauses or short quotes if helpful.\n"
    "3) PUSHBACKS (5 bullets): Polite, firm negotiation asks aligned to RISK_TOLERANCE.\n"
    "4) COUNTERPARTY: Extract the other party's name (client/vendor name, not individual person names).\n"
    "5) COUNTERPARTY_TYPE: Classify as either 'client' or 'vendor' based on the contract relationship.\n"
    "6) INDUSTRY: Identify the counterparty's industry if mentioned.\n\n"
    "CONTRACT TEXT:\n{contract}\n\n"
    "RETURN STRICT JSON with keys: summary (string), red_flags (string[ ]), pushbacks (string[ ]), "
    "counterparty (string), counterparty_type (string), industry (string or null)."
)

MODEL = os.getenv("LINDLE_MODEL", "gpt-4o-mini")


def call_openai(contract_text: str, role: str, risk: str) -> AnalysisResponse:
    if not _API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set on server")

    trimmed = contract_text[:20000]  # basic guardrail
    user_prompt = USER_PROMPT_TEMPLATE.format(role=role, risk=risk, contract=trimmed)

    completion = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    content = completion.choices[0].message.content or ""
    try:
        m = re.search(r"\{[\s\S]*\}", content)
        data = json.loads(m.group(0) if m else content)
        summary = (data.get("summary") or "").strip()
        red_flags = [str(x).strip() for x in (data.get("red_flags") or [])][:5]
        pushbacks = [str(x).strip() for x in (data.get("pushbacks") or [])][:5]
        counterparty = (data.get("counterparty") or "").strip() or None
        counterparty_type = (data.get("counterparty_type") or "").strip() or None
        industry = (data.get("industry") or "").strip() or None
    except Exception:
        summary, red_flags, pushbacks = content[:1000], [], []
        counterparty, counterparty_type, industry = None, None, None

    tokens_used = None
    try:
        tokens_used = getattr(completion, "usage", None).total_tokens
    except Exception:
        pass

    return AnalysisResponse(
        summary=summary, 
        red_flags=red_flags, 
        pushbacks=pushbacks, 
        tokens_used=tokens_used,
        counterparty=counterparty,
        counterparty_type=counterparty_type,
        industry=industry
    )

# ---------- PDF builder ----------
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.units import cm


def build_pdf(summary: str, red_flags: List[str], pushbacks: List[str]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>Lindle Contract Analysis</b>", styles['Title']))
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Summary</b>", styles['Heading2']))
    story.append(Paragraph(summary.replace('\n', '<br/>'), styles['BodyText']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Top 5 Red Flags</b>", styles['Heading2']))
    story.append(ListFlowable([ListItem(Paragraph(x, styles['BodyText'])) for x in red_flags], bulletType='bullet'))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Suggested Pushbacks</b>", styles['Heading2']))
    story.append(ListFlowable([ListItem(Paragraph(x, styles['BodyText'])) for x in pushbacks], bulletType='bullet'))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

# ---------- Routes ----------
@app.get("/")
async def root():
    return {"ok": True, "name": "Lindle MVP API", "version": "0.4"}


@app.get("/health")
async def health():
    return {
        "ok": True,
        "has_key": bool(os.getenv("OPENAI_API_KEY")),
        "project": bool(os.getenv("OPENAI_PROJECT")),
        "model": MODEL,
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    content = await file.read()
    text = _sniff_and_extract(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")
    
    result = call_openai(text, role=role, risk=risk_tolerance)
    
    # Upload file to Google Cloud Storage
    gcs_file_path = None
    if gcs_service:
        gcs_file_path = gcs_service.upload_file(
            file_content=content,
            file_name=file.filename,
            content_type=file.content_type
        )
        print(f"File uploaded to GCS: {gcs_file_path}")
    else:
        print("GCS service not available, skipping file upload")
    
    # Store contract information if counterparty is identified
    if result.counterparty and result.counterparty_type:
        try:
            entity = find_or_create_entity(
                name=result.counterparty,
                entity_type=result.counterparty_type,
                industry=result.industry
            )
            
            # Create contract record
            contract_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            
            contract = ContractOutcome(
                id=contract_id,
                entity_id=entity.id,
                contract_filename=file.filename or "unknown",
                outcome="Pending",  # Default to pending
                contract_summary=result.summary,
                red_flags_count=len(result.red_flags),
                pushbacks_count=len(result.pushbacks),
                role=role,
                risk_tolerance=risk_tolerance,
                created_at=now,
                updated_at=now
            )
            
            # Save contract
            contracts = load_contracts()
            contracts.append(contract)
            save_contracts(contracts)
            
            # Update entity reputation
            update_entity_reputation(entity.id)
            
        except Exception as e:
            # Don't fail the analysis if reputation tracking fails
            print(f"Warning: Failed to store reputation data: {e}")
    
    # Add GCS information to the result
    result_dict = result.dict()
    result_dict['gcs_file_path'] = gcs_file_path
    result_dict['gcs_file_url'] = gcs_service.get_file_url(gcs_file_path) if gcs_file_path else None
    
    return result_dict


@app.post("/analyze_pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    content = await file.read()
    text = _sniff_and_extract(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")

    result = call_openai(text, role=role, risk=risk_tolerance)
    
    # Upload file to Google Cloud Storage
    gcs_file_path = None
    if gcs_service:
        gcs_file_path = gcs_service.upload_file(
            file_content=content,
            file_name=file.filename,
            content_type=file.content_type
        )
        print(f"File uploaded to GCS during PDF generation: {gcs_file_path}")
    else:
        print("GCS service not available, skipping file upload")
    
    pdf_bytes = build_pdf(result.summary, result.red_flags, result.pushbacks)
    headers = {"Content-Disposition": "attachment; filename=contract_analysis.pdf"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)


# ---------- Reputation Tracking Endpoints ----------

@app.get("/entities")
async def get_entities():
    """Get all entities with their reputation scores"""
    entities = load_entities()
    return {"entities": [entity.dict() for entity in entities]}

@app.get("/entity/{entity_id}")
async def get_entity(entity_id: str):
    """Get entity details with contract history"""
    entities = load_entities()
    contracts = load_contracts()
    
    entity = None
    for e in entities:
        if e.id == entity_id:
            entity = e
            break
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    entity_contracts = [c for c in contracts if c.entity_id == entity_id]
    
    # Calculate performance metrics
    total = len(entity_contracts)
    if total > 0:
        successful = len([c for c in entity_contracts if c.outcome == "Successful Completion"])
        disputed = len([c for c in entity_contracts if c.outcome in ["Dispute", "Litigation"]])
        terminated = len([c for c in entity_contracts if c.outcome == "Early Termination"])
        pending = len([c for c in entity_contracts if c.outcome == "Pending"])
        
        performance_metrics = {
            "total_contracts": total,
            "success_rate": round((successful / total) * 100, 1),
            "dispute_rate": round((disputed / total) * 100, 1),
            "termination_rate": round((terminated / total) * 100, 1),
            "pending_contracts": pending,
            "avg_red_flags": round(sum(c.red_flags_count for c in entity_contracts) / total, 1)
        }
    else:
        performance_metrics = {
            "total_contracts": 0,
            "success_rate": 0,
            "dispute_rate": 0,
            "termination_rate": 0,
            "pending_contracts": 0,
            "avg_red_flags": 0
        }
    
    return ReputationSummary(
        entity=entity,
        contracts=entity_contracts,
        performance_metrics=performance_metrics
    ).dict()

@app.put("/contract/{contract_id}/outcome")
async def update_contract_outcome(
    contract_id: str,
    outcome: str = Form(...),
    notes: str = Form(None)
):
    """Update contract outcome"""
    valid_outcomes = ["Successful Completion", "Early Termination", "Dispute", "Litigation", "Pending"]
    if outcome not in valid_outcomes:
        raise HTTPException(status_code=400, detail=f"Invalid outcome. Must be one of: {valid_outcomes}")
    
    contracts = load_contracts()
    contract_found = False
    
    for contract in contracts:
        if contract.id == contract_id:
            contract.outcome = outcome
            contract.updated_at = datetime.utcnow().isoformat()
            if notes:
                contract.notes = notes
            contract_found = True
            
            # Update entity reputation
            update_entity_reputation(contract.entity_id)
            break
    
    if not contract_found:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    save_contracts(contracts)
    return {"message": "Contract outcome updated successfully"}

@app.get("/entities/search")
async def search_entities(
    query: str = None,
    outcome: str = None,
    risk_level: str = None
):
    """Search and filter entities"""
    entities = load_entities()
    contracts = load_contracts()
    results = []
    
    for entity in entities:
        entity_contracts = [c for c in contracts if c.entity_id == entity.id]
        
        # Apply filters
        if query and query.lower() not in entity.name.lower():
            continue
        
        if outcome:
            if not any(c.outcome == outcome for c in entity_contracts):
                continue
        
        if risk_level:
            if risk_level == "high" and entity.reputation_score > 50:
                continue
            elif risk_level == "low" and entity.reputation_score < 75:
                continue
        
        results.append({
            "entity": entity.dict(),
            "contract_count": len(entity_contracts),
            "latest_outcome": entity_contracts[-1].outcome if entity_contracts else "None"
        })
    
    return {"results": results}

@app.get("/reputation/report/{entity_id}")
async def generate_reputation_report(entity_id: str):
    """Generate detailed reputation report for an entity"""
    entities = load_entities()
    contracts = load_contracts()
    
    entity = None
    for e in entities:
        if e.id == entity_id:
            entity = e
            break
    
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    entity_contracts = [c for c in contracts if c.entity_id == entity_id]
    
    # Detailed analysis
    report = {
        "entity": entity.dict(),
        "summary": {
            "total_contracts": len(entity_contracts),
            "reputation_score": entity.reputation_score,
            "risk_assessment": "High Risk" if entity.reputation_score < 40 else 
                              "Medium Risk" if entity.reputation_score < 70 else "Low Risk"
        },
        "contract_history": [c.dict() for c in entity_contracts],
        "recommendations": []
    }
    
    # Generate recommendations
    if entity.reputation_score < 40:
        report["recommendations"].append("Exercise extreme caution - consider additional due diligence")
        report["recommendations"].append("Require stronger contract terms and penalties")
    elif entity.reputation_score < 70:
        report["recommendations"].append("Standard due diligence recommended")
        report["recommendations"].append("Consider performance bonds or escrow")
    else:
        report["recommendations"].append("Preferred partner - standard contract terms acceptable")
    
    dispute_rate = len([c for c in entity_contracts if c.outcome in ["Dispute", "Litigation"]])
    if dispute_rate > 0:
        report["recommendations"].append(f"Note: {dispute_rate} dispute(s) in history - review dispute resolution clauses")
    
    return report
