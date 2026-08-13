# AuroraSafe

AuroraSafe is an AI-powered predictive safety intelligence platform. It helps users understand local safety risk, report incidents, view danger hotspots, plan safer routes, and trigger an SOS flow from a web dashboard.

The project is built as a full-stack app:

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, Leaflet, Recharts, Framer Motion
- Backend: FastAPI, SQLAlchemy async, SQLite, Pydantic
- AI/ML: Gemini incident classification, XGBoost risk prediction, DBSCAN hotspot detection

> Note: AuroraSafe is a demo/hackathon-grade safety application. It is not a replacement for emergency services.

## Features

- Interactive safety map with heatmap overlays
- Location risk scoring with green, yellow, and red zone labels
- Community incident reporting with AI classification
- Hotspot detection from verified and pending incidents
- Safe-route generation that avoids high-risk red zones
- Analytics dashboard with trends, categories, and top hotspots
- SOS trigger flow with trusted contact management
- REST API with Swagger documentation

## Project Structure

```text
auroraSafe/
  backend/
    main.py              FastAPI app entry point
    database.py          Async SQLAlchemy setup
    config.py            Environment-based settings
    seed_data.py         Demo incident seeding
    ml/                  Risk model, classifier, hotspot detection
    models/              SQLAlchemy models
    routers/             API route modules
    schemas/             Pydantic schemas
  frontend/
    app/                 Next.js app routes
    components/          Shared UI components
    lib/                 Frontend helpers
    public/              Static assets
```

## Pages

- `/` - Landing page and platform overview
- `/map` - Safety heatmap, risk checker, and safe route tools
- `/report` - Incident reporting form with AI-generated classification
- `/dashboard` - Analytics, trends, categories, and hotspot tables
- `/sos` - SOS trigger and trusted contacts experience

## API Overview

Base URL: `http://localhost:8000`

- `GET /health` - API health check
- `GET /incidents` - List incident reports
- `POST /incidents` - Create an incident report
- `PUT /incidents/{id}/vote` - Upvote or downvote an incident
- `GET /safety/heatmap` - Heatmap points for the map
- `GET /safety/risk-score?lat=...&lng=...` - Predict location risk
- `GET /safety/zones` - Detected hotspot zones
- `GET /safety/nearby-alerts?lat=...&lng=...` - Nearby risky incidents
- `POST /routes/safe` - Generate a safer route between two coordinates
- `GET /dashboard/stats` - Dashboard summary metrics
- `GET /dashboard/trends` - Incident trends
- `GET /dashboard/categories` - Incident category breakdown
- `POST /sos/trigger` - Trigger SOS alert flow
- `GET /sos/contacts/{user_id}` - List trusted contacts

Swagger docs are available at `http://localhost:8000/docs`.

## Requirements

- Python 3.11 or newer
- Node.js 18 or newer
- npm

The current project has been tested locally with Python 3.13 and Next.js 14.2.5.

## Environment Variables

Backend: create `backend/.env`

```env
GEMINI_API_KEY=
SECRET_KEY=change-this-secret
DATABASE_URL=sqlite+aiosqlite:///./aurorasafe.db
```

Frontend: create `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`GEMINI_API_KEY` is optional for local demo use. If it is missing, incident classification falls back to a default local response.

## Run Locally

Start the backend:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Demo Flow

1. Open the landing page and introduce AuroraSafe as a predictive safety platform for Delhi NCR.
2. Go to `/map` and show the verified density heatmap. The Live News background fetcher continuously updates this!
3. Check a risk score with sample Delhi coordinates such as `28.6139, 77.2090`.
4. Generate a safer route to showcase how the algorithm actively paths around AI-detected red zones.
5. Provide a custom incident on `/report` to show real-time LLM validation.
6. Open `/dashboard` to showcase trends, rate-limit resilient charts, and real-time community vs news stats.
7. Open `/sos` and demonstrate the SOS trigger flow.
8. Open `/docs` to show the backend API contract.

## How It Works

AuroraSafe combines community reports, live scraped news, AI classification, and spatial risk scoring:

- **Live Data Ingestion**: APScheduler runs background jobs to fetch crime news from NewsAPI/GNews automatically, preventing blank states using smart fallback data if rate limits are hit.
- **Incident Storage**: Incident reports are stored computationally fast in SQLite through async SQLAlchemy.
- **LLM Contextualization**: Gemini 1.5/2.0 classifies incident type, severity, category, confidence, and summary with strict constraints (no severity inflation).
- **Predictive Grounding**: XGBoost predicts risk scores using historical lat/lng density mixed directly from the SQLite database.
- **Unsupervised Hotspots**: DBSCAN groups incident clusters into dynamic hotspot regions automatically.
- **Visualization**: The Next.js client renders dynamic mapping, dynamic Recharts (SSR optimized), and routing.

On backend startup, the app gracefully initializes all background jobs, seeds fallbacks if necessary, and compiles the ML models dynamically.


