# Lindle Backend

FastAPI backend for Lindle MVP that provides contract analysis using OpenAI.

## Features

- Upload PDF, DOCX, or TXT contracts
- AI-generated summary, red flags, and pushback suggestions
- PDF report generation
- RESTful API with automatic documentation

## API Endpoints

- `GET /` - API status and version
- `GET /health` - Health check with OpenAI configuration status
- `POST /analyze` - Analyze contract and return JSON response
- `POST /analyze_pdf` - Analyze contract and return downloadable PDF

## Environment Variables

- `OPENAI_API_KEY` (required) - Your OpenAI API key
- `OPENAI_PROJECT` (optional) - OpenAI project ID for sk-proj keys
- `LINDLE_MODEL` (optional) - OpenAI model to use (default: gpt-4o-mini)

## Running with Docker

### Build the image:
```bash
docker build -t lindle-backend .
```

### Run the container:
```bash
docker run -p 8000:8000 -e OPENAI_API_KEY=your-key-here lindle-backend
```

### With optional project ID:
```bash
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your-key-here \
  -e OPENAI_PROJECT=proj_... \
  lindle-backend
```

## Running Locally

### Install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Set environment variables:
```bash
export OPENAI_API_KEY=your-key-here
# Optional:
export OPENAI_PROJECT=proj_...
```

### Run the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc