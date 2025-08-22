"""Integration tests for API endpoints."""

import io
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root status endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["name"] == "Lindle MVP API"
    assert data["version"] == "0.4"


def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "has_key" in data
    assert "project" in data
    assert "model" in data


@patch('routes.analysis.analyze_contract')
def test_analyze_endpoint_with_mock(mock_analyze):
    """Test the analyze endpoint with mocked OpenAI response."""
    from models.analysis import AnalysisResponse
    
    # Setup mock response
    mock_analyze.return_value = AnalysisResponse(
        summary="Test summary",
        red_flags=["Test flag"],
        pushbacks=["Test pushback"],
        tokens_used=100
    )
    
    # Create test file
    test_file_content = b"This is a test contract with enough content to pass validation."
    
    response = client.post(
        "/analyze",
        files={"file": ("test.txt", io.BytesIO(test_file_content), "text/plain")},
        data={"role": "freelancer", "risk_tolerance": "standard"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "red_flags" in data
    assert "pushbacks" in data


def test_analyze_endpoint_empty_file():
    """Test the analyze endpoint with empty file."""
    test_file_content = b""
    
    response = client.post(
        "/analyze",
        files={"file": ("test.txt", io.BytesIO(test_file_content), "text/plain")},
        data={"role": "freelancer", "risk_tolerance": "standard"}
    )
    
    assert response.status_code == 400
    assert "empty or too short" in response.json()["detail"]


@patch('routes.analysis.analyze_contract')
def test_analyze_pdf_endpoint_with_mock(mock_analyze):
    """Test the analyze_pdf endpoint with mocked OpenAI response."""
    from models.analysis import AnalysisResponse
    
    # Setup mock response
    mock_analyze.return_value = AnalysisResponse(
        summary="Test summary",
        red_flags=["Test flag"],
        pushbacks=["Test pushback"],
        tokens_used=100
    )
    
    # Create test file
    test_file_content = b"This is a test contract with enough content to pass validation."
    
    response = client.post(
        "/analyze_pdf",
        files={"file": ("test.txt", io.BytesIO(test_file_content), "text/plain")},
        data={"role": "freelancer", "risk_tolerance": "standard"}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")


def test_analyze_endpoint_unsupported_file():
    """Test the analyze endpoint with unsupported file type."""
    test_file_content = b"This is a test contract."
    
    response = client.post(
        "/analyze",
        files={"file": ("test.xyz", io.BytesIO(test_file_content), "application/octet-stream")},
        data={"role": "freelancer", "risk_tolerance": "standard"}
    )
    
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]