"""Tests for file processor service."""

import pytest
from fastapi import HTTPException
from services.file_processor import extract_text_from_file


def test_extract_text_from_txt():
    """Test text extraction from TXT file."""
    content = b"This is a test contract."
    result = extract_text_from_file("test.txt", content)
    assert result == "This is a test contract."


def test_extract_text_from_unsupported_format():
    """Test extraction from unsupported file format raises HTTPException."""
    content = b"test content"
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_file("test.xyz", content)
    
    assert exc_info.value.status_code == 400
    assert "Unsupported file type" in exc_info.value.detail


def test_extract_text_from_file_without_extension():
    """Test extraction from file without extension raises HTTPException."""
    content = b"test content"
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_file("testfile", content)
    
    assert exc_info.value.status_code == 400
    assert "Unsupported file type" in exc_info.value.detail


def test_extract_text_case_insensitive():
    """Test that file extension matching is case insensitive."""
    content = b"This is a test contract."
    result = extract_text_from_file("test.TXT", content)
    assert result == "This is a test contract."