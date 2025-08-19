# Backend Architecture Documentation

This document describes the refactored backend architecture for the Lindle MVP API.

## File Structure

```
Backend/
├── main.py                      # FastAPI application setup and routing
├── models/                      # Data models
│   ├── __init__.py
│   └── analysis.py             # AnalysisResponse model
├── routes/                      # API route handlers
│   ├── __init__.py
│   ├── analysis.py             # Contract analysis endpoints (/analyze, /analyze_pdf)
│   └── health.py               # Health and status endpoints (/, /health)
├── services/                    # Business logic services
│   ├── __init__.py
│   ├── file_processor.py       # File extraction utilities (PDF, DOCX, TXT)
│   ├── openai_service.py       # OpenAI integration for contract analysis
│   └── pdf_service.py          # PDF report generation
└── tests/                       # Test suite
    ├── __init__.py
    ├── test_api.py             # API endpoint integration tests
    ├── test_file_processor.py  # File processing unit tests
    ├── test_models.py          # Data model tests
    └── test_pdf_service.py     # PDF generation tests
```

## Architecture Overview

The backend has been refactored from a single `main.py` file into a modular architecture following separation of concerns:

### Models (`models/`)
- Contains Pydantic data models for API request/response objects
- `AnalysisResponse`: Contract analysis result structure

### Routes (`routes/`)
- FastAPI router modules for different API endpoint groups
- `health.py`: Status and health check endpoints
- `analysis.py`: Contract analysis endpoints

### Services (`services/`)
- Business logic and external service integrations
- `file_processor.py`: Handles text extraction from PDF, DOCX, and TXT files
- `openai_service.py`: Manages OpenAI API integration for contract analysis
- `pdf_service.py`: Generates PDF reports from analysis results

### Tests (`tests/`)
- Comprehensive test suite covering all modules
- Unit tests for individual services and models
- Integration tests for API endpoints

## Key Improvements

1. **Modularity**: Separated concerns into logical modules
2. **Testability**: Added comprehensive test coverage (16 tests)
3. **Maintainability**: Clear separation between API layer, business logic, and data models
4. **Reusability**: Services can be easily imported and used in different contexts

## API Endpoints

The API maintains the same external interface:

- `GET /` - API status and version
- `GET /health` - Health check with OpenAI configuration status  
- `POST /analyze` - Analyze contract and return JSON response
- `POST /analyze_pdf` - Analyze contract and return downloadable PDF

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/ -v

# Run specific test module
pytest tests/test_api.py -v
```

## Environment Variables

- `OPENAI_API_KEY` (required) - Your OpenAI API key
- `OPENAI_PROJECT` (optional) - OpenAI project ID for sk-proj keys
- `LINDLE_MODEL` (optional) - OpenAI model to use (default: gpt-4o-mini)