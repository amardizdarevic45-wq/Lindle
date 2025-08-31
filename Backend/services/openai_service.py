"""OpenAI service for contract analysis."""

import json
import os
import re
from fastapi import HTTPException
from models.analysis import AnalysisResponse

# Import OpenAI client
try:
    from openai import OpenAI
except Exception as e:
    raise RuntimeError("OpenAI SDK not installed. Run: pip install openai")

# OpenAI configuration
_API_KEY = os.getenv("OPENAI_API_KEY")
_PROJECT = os.getenv("OPENAI_PROJECT")

def _get_openai_client():
    """Get OpenAI client instance."""
    if not _API_KEY:
        return None
    return OpenAI(api_key=_API_KEY, project=_PROJECT) if _PROJECT else OpenAI(api_key=_API_KEY)

# Model configuration
MODEL = os.getenv("LINDLE_MODEL", "gpt-4o-mini")

# Prompts
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


def analyze_contract(contract_text: str, role: str, risk: str) -> AnalysisResponse:
    """Analyze contract text using OpenAI and return structured response."""
    if not _API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set on server")

    client = _get_openai_client()
    if not client:
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

    return AnalysisResponse(
        summary=summary, 
        red_flags=red_flags, 
        pushbacks=pushbacks, 
        tokens_used=tokens_used
    )