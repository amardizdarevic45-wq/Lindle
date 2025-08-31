# Lindle MVP 
**All your contracts. One companion. Smart. Clear. Fun.**
<p align="left">
  <img src="lindle-logo-transparent.png" alt="Lindle Logo" width="220"/>
</p>

**AI-powered contract assistant** for freelancers, consultants, and agencies.  
Upload a contract and Lindle will instantly deliver:  
- 📄 A **clear summary** of the document  
- ⚠️ **Red flags** to watch out for  
- 💡 **Pushback suggestions** you can use in negotiations  
- 📥 A downloadable **PDF review report**    

🌍 **Vision**  
To empower the global solo economy with clarity and confidence in every contract, making legal language as accessible as everyday conversation.  

🎯 **Mission**  
Lindle is building an AI-powered contract companion that helps freelancers, consultants, and agencies instantly understand, negotiate, and manage their agreements — from red flag detection and pushback suggestions to reminders, clause storage, and live contract chat.  


## Features
- Upload **PDF, DOCX, or TXT** contracts  
- Get **AI-generated insights** in real-time  
- Modern **Next.js React frontend** with TypeScript support
- Responsive design with **TailwindCSS**
- Backend built with **FastAPI + OpenAI API**  
- Export a professional **PDF report** (summary, red flags, pushbacks)  



## Tech Stack
- **Backend:** FastAPI, OpenAI API, ReportLab, PyMuPDF, python-docx  
- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS  
- **Server:** Uvicorn (local dev)
- **Runtime:** Node.js 20+
  


## Roadmap (Beyond MVP)

The current MVP focuses on contract analysis (summary, red flags, pushbacks, PDF export).  
In the next iterations, Lindle will expand into a **full AI-powered contract workspace** for freelancers and agencies:

- 💬 **Live Contract Chat** – ask questions directly about your contract in plain language.  
- 📂 **Personal Clause/Contract Vault** – save your preferred clauses for reuse in future negotiations and store your contracts.  
- ⏰ **Smart Reminders** – get nudges for deadlines, renewals, or unpaid invoices linked to contracts.  
- 🤝 **Reputation Tracker** – keep a history of past clients/vendors with contract outcomes.  
- 📊 **Insights Dashboard** – visualize risk exposure and negotiation wins across contracts.  



## Run Locally

Clone the project:

```bash
git clone https://github.com/amardizdarevic45-wq/Lindle.git
cd Lindle
```

### Backend Setup

1. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies:
```bash
pip install -U fastapi uvicorn python-multipart pydantic openai PyMuPDF python-docx reportlab
```

3. Set up your OpenAI API key:
```bash
export OPENAI_API_KEY=sk-your-api-key-here
# Optional for sk-proj keys:
export OPENAI_PROJECT=proj_your-project-id
```

4. Start the FastAPI backend:
```bash
uvicorn lindle_mvp_backend_fastapi:app --reload
```

The backend will be available at http://127.0.0.1:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the Next.js development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

### Usage

1. Open your browser to http://localhost:3000
2. Click "Get Started" to access the contract analysis tool
3. Upload a PDF, DOCX, or TXT contract file
4. Select your role (Freelancer, Consultant, or Agency)
5. Choose your risk tolerance (Cautious, Standard, or Bold)
6. Click "Analyze Contract" to get AI-powered insights
7. Download a PDF report of the analysis if desired

## API Endpoints

- `GET /` - API status
- `GET /health` - Health check with API key status
- `POST /analyze` - Analyze contract and return JSON results
- `POST /analyze_pdf` - Analyze contract and return PDF report
=======
### Option 1: Docker (Recommended)

Run the backend with Docker:

```bash
cd Backend
docker build -t lindle-backend .
docker run -p 8000:8000 -e OPENAI_API_KEY=your-key-here lindle-backend
```

Or using Docker Compose (copy .env.example to .env and fill in your API key):

```bash
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
docker compose up --build
```

Then open `lindle_mvp_frontend.html` in your browser.

### Option 2: Local Development

Set up the backend:

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY=your-key-here
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open `lindle_mvp_frontend.html` in your browser.

# Install backend dependencies
cd Backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set up OpenAI API key
export OPENAI_API_KEY=sk-...
# Optional for project-based keys:
export OPENAI_PROJECT=proj_...

# Start the backend server
uvicorn lindle_mvp_backend_fastapi:app --reload

# In a new terminal, start the React frontend
cd ../Frontend
npm install
npm start

# The React app will open in your browser at http://localhost:3000
```

For production deployment:

```bash
# Build the React app for production
cd Frontend
npm run build

# Serve the build folder with any static file server
# Example with a simple Python server:
cd build
python3 -m http.server 3000
```

## Project Structure

```
Lindle/
├── Backend/
│   ├── lindle_mvp_backend_fastapi.py    # FastAPI backend with reputation tracking
│   └── requirements.txt                  # Python dependencies
├── Frontend/                             # React application
│   ├── public/                           # Static assets
│   │   ├── lindle-logo-transparent.png  # Logo assets
│   │   └── lindle-logo.png
│   ├── src/
│   │   ├── components/                   # React components
│   │   │   ├── LindleApp.js             # Main app component
│   │   │   ├── Navigation.js            # Navigation tabs
│   │   │   ├── ContractAnalysis.js      # Contract analysis feature
│   │   │   ├── ReputationTracker.js     # Reputation management
│   │   │   └── EntityModal.js           # Entity detail modal
│   │   ├── App.js                       # App entry point
│   │   └── index.js                     # React DOM render
│   ├── package.json                     # Node.js dependencies
│   └── README.md                        # React app documentation
├── Frontend_backup/                     # Backup of original HTML files
└── README.md
```
