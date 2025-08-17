# lindle_mvp_backend_fastapi_fixed.py
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
#   uvicorn lindle_mvp_backend_fastapi_fixed:app --reload

from __future__ import annotations

import io
import json
import os
import re
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
    "3) PUSHBACKS (5 bullets): Polite, firm negotiation asks aligned to RISK_TOLERANCE.\n\n"
    "CONTRACT TEXT:\n{contract}\n\n"
    "RETURN STRICT JSON with keys: summary (string), red_flags (string[ ]), pushbacks (string[ ])."
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
    except Exception:
        summary, red_flags, pushbacks = content[:1000], [], []

    tokens_used = None
    try:
        tokens_used = getattr(completion, "usage", None).total_tokens
    except Exception:
        pass

    return AnalysisResponse(summary=summary, red_flags=red_flags, pushbacks=pushbacks, tokens_used=tokens_used)

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
    return call_openai(text, role=role, risk=risk_tolerance)


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
    pdf_bytes = build_pdf(result.summary, result.red_flags, result.pushbacks)
    headers = {"Content-Disposition": "attachment; filename=contract_analysis.pdf"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
