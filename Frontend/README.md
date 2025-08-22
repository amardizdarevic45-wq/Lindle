# FrontendUI - Unified Lindle Next.js Application

This is the unified Next.js frontend application that combines all Lindle features including:
- Contract Analysis with Firebase integration
- Reputation Tracker
- Subscription pricing
- Waiting list functionality
- Modern glassmorphism design

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Features

- **Contract Analysis**: Upload and analyze contracts with AI-powered insights
- **Reputation Tracker**: Track client/vendor contract outcomes and reputation scores
- **Firebase Integration**: Automatic data saving for analysis results and waiting list
- **Glassmorphism Design**: Modern UI with backdrop blur effects
- **TypeScript**: Full type safety
- **Responsive Design**: Works on all devices

## Configuration

The `config.json` file contains:
- Firebase configuration
- API endpoints
- Environment settings

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── analyze/page.tsx    # Contract analysis
│   ├── pricing/page.tsx    # Subscription pricing
│   ├── waitinglist/page.tsx # Waiting list
│   ├── reputation/page.tsx  # Reputation tracker
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── ReputationTracker.tsx # Reputation tracking
│   └── EntityModal.tsx     # Entity details modal
└── firebase.ts             # Firebase configuration
```

## Dependencies

- Next.js 13.5.6 (compatible with Node.js 18.16.1)
- React 18.2.0
- Firebase 9.23.0
- TypeScript 5
- Tailwind CSS 3.4.0 