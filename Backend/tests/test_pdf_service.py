"""Tests for PDF service."""

from services.pdf_service import generate_analysis_pdf


def test_generate_analysis_pdf():
    """Test PDF generation with sample data."""
    summary = "This is a test contract summary."
    red_flags = ["Red flag 1", "Red flag 2"]
    pushbacks = ["Pushback 1", "Pushback 2"]
    
    pdf_bytes = generate_analysis_pdf(summary, red_flags, pushbacks)
    
    # Check that we got bytes back
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    
    # Check that it looks like a PDF (starts with PDF header)
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_with_empty_lists():
    """Test PDF generation with empty red flags and pushbacks."""
    summary = "Test summary"
    red_flags = []
    pushbacks = []
    
    pdf_bytes = generate_analysis_pdf(summary, red_flags, pushbacks)
    
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_with_multiline_summary():
    """Test PDF generation with multiline summary."""
    summary = "Line 1\nLine 2\nLine 3"
    red_flags = ["Flag 1"]
    pushbacks = ["Pushback 1"]
    
    pdf_bytes = generate_analysis_pdf(summary, red_flags, pushbacks)
    
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF-")