"""Tests for the analysis model."""

from models.analysis import AnalysisResponse


def test_analysis_response_creation():
    """Test creating AnalysisResponse with all fields."""
    response = AnalysisResponse(
        summary="Test summary",
        red_flags=["Flag 1", "Flag 2"],
        pushbacks=["Pushback 1", "Pushback 2"],
        tokens_used=100
    )
    
    assert response.summary == "Test summary"
    assert response.red_flags == ["Flag 1", "Flag 2"]
    assert response.pushbacks == ["Pushback 1", "Pushback 2"]
    assert response.tokens_used == 100


def test_analysis_response_without_tokens():
    """Test creating AnalysisResponse without tokens_used field."""
    response = AnalysisResponse(
        summary="Test summary",
        red_flags=["Flag 1"],
        pushbacks=["Pushback 1"]
    )
    
    assert response.summary == "Test summary"
    assert response.red_flags == ["Flag 1"]
    assert response.pushbacks == ["Pushback 1"]
    assert response.tokens_used is None


def test_analysis_response_with_empty_lists():
    """Test creating AnalysisResponse with empty lists."""
    response = AnalysisResponse(
        summary="Test summary",
        red_flags=[],
        pushbacks=[]
    )
    
    assert response.summary == "Test summary"
    assert response.red_flags == []
    assert response.pushbacks == []
    assert response.tokens_used is None