# Lindle Frontend

This is a Next.js frontend application for the Lindle contract analysis tool.

## Features

- Landing page with hero section and branding
- Contract analysis page with file upload functionality
- Supports PDF, DOCX, and TXT file formats
- Real-time analysis results display
- PDF report download functionality
- Responsive design with TailwindCSS
- TypeScript support

## Getting Started

### Prerequisites

- Node.js 20.0.0 or higher
- npm

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   ```bash
   cp .env.local.example .env.local
   ```
   Update the API URL if needed (default: http://127.0.0.1:8000)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## API Integration

The frontend communicates with the FastAPI backend running on port 8000. Make sure the backend server is running for full functionality.

### Endpoints Used

- `POST /analyze` - Analyze contract and return JSON results
- `POST /analyze_pdf` - Analyze contract and return PDF report

## Pages

- `/` - Landing page with hero section
- `/analyze` - Contract analysis page with upload form and results

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://127.0.0.1:8000)

## Tech Stack

- **Framework**: Next.js 15.4.6
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Runtime**: Node.js 20+
