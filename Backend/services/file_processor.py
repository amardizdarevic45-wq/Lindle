"""File processing utilities for extracting text from various file formats."""

import io
from typing import List
from fastapi import HTTPException


SUPPORTED_EXTS = {"pdf", "docx", "txt"}


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes."""
    import fitz  # PyMuPDF
    text_parts: List[str] = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text("text") or "")
    return "\n".join(text_parts).strip()


def _extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file bytes."""
    import docx
    f = io.BytesIO(file_bytes)
    document = docx.Document(f)
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text from uploaded file based on file extension."""
    ext = (filename.split(".")[-1] or "").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: .{ext}. Use PDF, DOCX, or TXT."
        )
    
    try:
        if ext == "pdf":
            return _extract_text_from_pdf(content)
        if ext == "docx":
            return _extract_text_from_docx(content)
        return content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to read {ext.upper()} file: {e}"
        )