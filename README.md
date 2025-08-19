# Lindle MVP 
**All your contracts. One companion. Smart. Clear. Fun.**
![Lindle Logo](lindle-logo-transparent.png)
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
- Simple, intuitive **web interface** (HTML + TailwindCSS)  
- Backend built with **FastAPI + OpenAI API**  
- Export a professional **PDF report** (summary, red flags, pushbacks)  



## Tech Stack
- **Backend:** FastAPI, OpenAI API, ReportLab, PyMuPDF, python-docx  
- **Frontend:** HTML + TailwindCSS  
- **Server:** Uvicorn (local dev)
  


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
docker-compose up --build
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

