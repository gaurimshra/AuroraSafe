# AuroraSafe

AI-powered predictive safety intelligence platform for Delhi NCR, focused on helping women assess local risk, avoid unsafe areas, report incidents, and trigger SOS support.

[Demo](#usage) · [Documentation](#api-overview) · [GitHub](.) · [License](#license)

## Achievement

AuroraSafe won **2nd Runner Up** at the **Girls Hackday Hackathon**, held at the **Paytm office**. Thanks and appreciation to the team members **Jaya Chaturvedi**, **Ruchi**, and **Pragati Sagar** for working on this project.

> AuroraSafe is a demo / hackathon-grade safety application. It can support awareness, routing, reporting, and emergency workflows, but it is not a replacement for police, ambulance, or official emergency services.

## ✨ Features

- Interactive safety map for Delhi NCR with incident markers, heatmap intensity, and AI-detected hotspot zones.
- Location risk scoring by address or coordinates with green, yellow, and red safety zones.
- Explainable live safety factors using incident history, recent news, weather, time of day, and nearby infrastructure.
- AI incident classification using Gemini, including incident type, severity, threat category, confidence, and summary.
- Community incident reporting with map pinning, reverse geocoding, optional evidence capture UI, and community voting.
- Safe route generation using OSRM route alternatives, with risk penalties around red zones and fallback routing if OSRM is unavailable.
- Analytics dashboard with totals, source breakdowns, weather status, incident trends, category charts, recent incidents, and hotspot tables.
- SOS flow with trusted contacts, WhatsApp alert links, nearby NGO suggestions, emergency numbers, event history, stealth mode, shake-to-SOS, walk tracking, and local blackbox evidence recording.
- NGO directory with call, WhatsApp, and map navigation actions.
- User profile dashboard for trusted contacts, saved routes, SOS history, and personal incident reports.
- Background data pipeline for news ingestion, weather refresh, stale incident cleanup, and service-status inspection.
- REST API with FastAPI Swagger documentation.

## Problem Statement

Most safety tools are reactive: they help after a person is already in danger. Users need earlier, location-aware intelligence that answers practical questions before and during travel:

- Is this area safe right now?
- Which route avoids recent or historically risky zones?
- What incidents have the community or news sources reported nearby?
- Who can be alerted quickly if something goes wrong?
- How can emergency actions be recorded and surfaced without adding panic or friction?

## Solution

AuroraSafe combines community reports, live external signals, machine learning, and map-based workflows into one safety companion. It predicts local risk, explains the factors behind the score, visualizes hotspots, recommends safer routes, and provides one-tap emergency escalation through trusted contacts and nearby support organizations.

The system is designed around prevention first: predict risk, route around danger, keep users informed, and escalate when needed.

## Architecture

```text
auroraSafe/
├── backend/
│   ├── main.py                 FastAPI app entry point and startup pipeline
│   ├── config.py               Environment-driven settings
│   ├── database.py             Async SQLAlchemy + SQLite setup
│   ├── seed_data.py            Demo incident seed data
│   ├── migrate_db.py           Database migration helper
│   ├── models/                 SQLAlchemy models
│   ├── schemas/                Pydantic request/response schemas
│   ├── routers/                API route modules
│   ├── services/               News, weather, OSM, and scheduler services
│   ├── ml/                     Gemini classifier, XGBoost risk model, DBSCAN hotspots
│   └── data/ngos.json          Local NGO partner dataset
├── frontend/
│   ├── app/                    Next.js App Router pages
│   ├── components/             Shared map, shell, cards, badges, modals
│   ├── lib/                    API client, geocoding, theme, imagery helpers
│   └── public/                 Static images
└── README.md
```

## How It Works

1. The FastAPI backend starts, initializes the SQLite database, seeds demo incidents if the database is empty, and loads or trains the XGBoost risk model.
2. APScheduler starts background jobs for news ingestion, weather refresh, and expired incident cleanup.
3. News and community reports are stored as incidents with location, severity, source, status, votes, AI summary, and risk metadata.
4. Gemini classifies submitted incident text into structured safety categories. If no Gemini key is available, the backend uses a safe local fallback classification.
5. The risk model predicts a normalized risk score for a coordinate using location, time, day, severity, and encoded incident type features.
6. DBSCAN clusters nearby incidents into hotspot zones and labels them by combined risk and severity.
7. The frontend fetches heatmap points, incidents, hotspots, weather, live factors, and dashboard metrics from the API.
8. For route planning, the backend requests OSRM route alternatives, penalizes routes near red zones, and returns the safest available route. If OSRM fails, it returns a straight-line fallback that avoids nearby red-zone centers.
9. SOS triggers create a verified red-zone incident, log an SOS event, generate WhatsApp links for trusted contacts, and return nearby NGOs.

## Tech Stack

**Frontend**

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- React Leaflet, Leaflet, leaflet.heat
- Recharts
- Framer Motion
- Lucide React icons
- Axios
- Clerk authentication
- Zustand and Socket.IO client dependencies available for state/realtime extensions

**Backend**

- FastAPI
- Uvicorn
- Async SQLAlchemy 2
- SQLite with `aiosqlite`
- Pydantic v2 and pydantic-settings
- APScheduler
- HTTPX
- python-jose and passlib for JWT/password auth routes

**AI / ML / Data**

- Google Gemini for incident classification
- XGBoost for risk prediction
- scikit-learn DBSCAN for hotspot detection
- NumPy and pandas for model training data
- NewsAPI and GNews for incident news ingestion
- OpenWeather for weather-derived safety factors
- OpenStreetMap / Overpass for police stations and nearby safety POIs
- OSRM public router for road route alternatives

## Pages

| Page | Purpose |
| --- | --- |
| `/` | Landing page with AuroraSafe positioning, core stats, and feature overview. |
| `/map` | Main safety workspace with map overlays, zone filters, risk checker, safe route tool, nearby alerts, live data status, and weather strip. |
| `/report` | Incident submission flow with location picker, current-location support, reverse geocoding, description validation, optional media capture UI, and AI classification result. |
| `/community` | Feed of recent community and news incidents with source labels, risk badges, location, source article links, and upvote/downvote verification. |
| `/dashboard` | Safety analytics view with source breakdowns, SOS counts, weather, trends, category chart, recent incidents, and detected hotspot table. |
| `/ngos` | NGO partner directory with address, phone, email, WhatsApp, and directions actions. |
| `/business` | Business model page explaining potential B2B, B2B2C, CSR, freemium, and government dashboard revenue streams. |
| `/sos` | Emergency workflow with one-tap SOS, trusted contacts, WhatsApp links, NGO suggestions, emergency numbers, stealth mode, shake SOS, walk tracking, evidence recording, and history. |
| `/profile` | Signed-in user dashboard for contacts, saved routes, SOS history, and personal incident reports. |
| `/incidents/[id]` | Incident detail page with image, metadata, map location, full description, and community voting. |

## API Overview

Default backend URL: `http://localhost:8000`

Swagger UI: `http://localhost:8000/docs`

### Core

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | API status, version, region, and source list. |
| `GET` | `/health` | Health check with scheduler and news-fetch stats. |

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a local backend user. |
| `POST` | `/auth/login` | Login and receive a JWT access token. |

### Incidents

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/incidents/` | List incidents with optional `lat`, `lng`, `radius_km`, `status`, `user_id`, `source`, and `limit` filters. |
| `POST` | `/incidents/` | Create an incident and classify it with Gemini/fallback AI. |
| `GET` | `/incidents/{id}` | Fetch a single incident. |
| `PUT` | `/incidents/{id}/vote` | Record an upvote or downvote. |

### Safety

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/safety/heatmap` | Return weighted heatmap points from verified and pending incidents. |
| `GET` | `/safety/risk-score` | Predict risk for `lat` and `lng`. |
| `GET` | `/safety/zones` | Return DBSCAN hotspot zones. |
| `GET` | `/safety/nearby-alerts` | Return yellow/red incidents near a coordinate. |

### Routes

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/routes/safe` | Generate a safer route between origin and destination coordinates. |

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/dashboard/stats` | Summary metrics, source counts, and zone counts. |
| `GET` | `/dashboard/trends` | Incident trend data for the last 30 days. |
| `GET` | `/dashboard/categories` | Incident category distribution. |
| `GET` | `/dashboard/heatmap-zones` | Top detected hotspot zones for analytics. |

### SOS

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/sos/trigger` | Trigger SOS, log event, create red-zone incident, generate WhatsApp links, and find nearby NGOs. |
| `GET` | `/sos/history` | Get recent SOS events, optionally filtered by `user_id`. |
| `GET` | `/sos/contacts/{user_id}` | List trusted contacts. |
| `POST` | `/sos/contacts` | Add a trusted contact. |
| `DELETE` | `/sos/contacts/{contact_id}` | Delete a trusted contact. |

### Saved Routes

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/saved-routes/{user_id}` | List saved routes for a user. |
| `POST` | `/saved-routes/` | Save a route. |
| `DELETE` | `/saved-routes/{route_id}` | Delete a saved route. |

### Data Sources

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/data-sources/status` | Inspect scheduler state, configured keys, target cities, and job stats. |
| `POST` | `/data-sources/trigger/news` | Manually trigger news ingestion. |
| `POST` | `/data-sources/trigger/weather` | Manually refresh weather for NCR cities. |
| `GET` | `/data-sources/weather` | Current weather and safety factor for a city. |
| `GET` | `/data-sources/weather/all` | Weather for all configured NCR cities. |
| `GET` | `/data-sources/police-stations` | Police stations from OpenStreetMap / Overpass. |
| `GET` | `/data-sources/ngos` | Local NGO partner data. |
| `GET` | `/data-sources/nearby-pois` | Nearby safety POIs and safety adjustment. |
| `GET` | `/data-sources/live-factors` | Full explainable safety-factor breakdown for a coordinate. |

## ⚙️ Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- Git

### 1. Clone the repository

```powershell
git clone <-repo-url>
cd auroraSafe
```

### 2. Backend setup

```powershell
cd backend
python -m venv ..\.venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
& ..\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=
SECRET_KEY=change-this-secret
DATABASE_URL=sqlite+aiosqlite:///./aurorasafe.db
NEWS_API_KEY=
GNEWS_API_KEY=
OPENWEATHER_API_KEY=
```

Start the API:

```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend setup

Open a second terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Start the frontend:

```powershell
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Usage

1. Start the backend and frontend.
2. Open `/map` and wait for incidents, heatmap points, hotspots, weather, and pipeline status to load.
3. Use the Risk Score tab to search an address such as `Connaught Place, Delhi` or enter coordinates like `28.6139, 77.2090`.
4. Use the Safe Route tab to enter an origin and destination. The backend will compare OSRM route alternatives and prefer the route with fewer red-zone conflicts.
5. Submit a report from `/report` and review the returned AI classification.
6. Open `/community` to see the report in the feed and test voting.
7. Open `/dashboard` to inspect trends, incident categories, source counts, weather factors, and hotspots.
8. Add contacts on `/sos` or `/profile`, then test the SOS flow. For demo safety, verify phone numbers before opening WhatsApp links.

## Environment Variables

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional | Enables Gemini incident classification. Without it, local fallback classification is used. |
| `SECRET_KEY` | Recommended | JWT signing secret for backend auth routes. |
| `DATABASE_URL` | Optional | Async SQLAlchemy database URL. Defaults to local SQLite. |
| `NEWS_API_KEY` | Optional | Enables NewsAPI ingestion. |
| `GNEWS_API_KEY` | Optional | Enables GNews ingestion. |
| `OPENWEATHER_API_KEY` | Optional | Enables live OpenWeather data. |
| `CORS_ORIGINS` | Optional | Allowed frontend origins. Defaults include local frontend and one Vercel URL. |
| `TARGET_CITIES` | Optional | Comma-separated NCR cities for weather/news workflows. |
| `NEWS_FETCH_INTERVAL_MINUTES` | Optional | Scheduler interval for news ingestion. |
| `WEATHER_REFRESH_INTERVAL_MINUTES` | Optional | Scheduler interval for weather refresh. |
| `INCIDENT_EXPIRY_DAYS` | Optional | Expiry window for stale news incidents. |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for the FastAPI backend. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required for Clerk sign-in | Public Clerk key for frontend auth. |
| `CLERK_SECRET_KEY` | Required for Clerk middleware/server auth | Clerk secret key. |

## Testing

Backend service checks:

```powershell
cd backend
& ..\.venv\Scripts\Activate.ps1
python test_services.py
python test_live_factors.py
```

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

The backend test files are lightweight integration checks for weather, geocoding, POIs, database incidents, and live safety-factor logic. They may call external services, so results depend on API keys and network availability.

## Results / Performance

- Risk scores are normalized from `0.0` to `1.0` and mapped to green, yellow, or red zones.
- Hotspots are generated with DBSCAN using a 1.5 km clustering radius and a minimum of 4 samples.
- Heatmap point weight combines risk score and incident severity.
- The scheduler is configured for frequent demo updates: news every 5 minutes and weather every 30 minutes by default.
- The safe route endpoint prefers real road routes from OSRM and falls back gracefully when the external router is unavailable.
- The dashboard refreshes client-side data on an interval so demos show changing pipeline state without a page reload.

## Key Technical Decisions

- **Prevention-first UX:** The main product flow centers on risk checking and safer routing before an emergency happens.
- **Explainable safety scoring:** `/data-sources/live-factors` exposes why an area is risky instead of only returning a color.
- **Hybrid AI approach:** Gemini handles text understanding, while XGBoost and DBSCAN handle numerical/spatial prediction.
- **Graceful fallbacks:** Missing Gemini, weather, news, OSM, or OSRM services should not fully break the demo.
- **Async backend:** FastAPI and async SQLAlchemy keep I/O-heavy workflows responsive.
- **SQLite for demo speed:** Local SQLite keeps setup simple while preserving a clear path to Postgres for production.
- **Client-side map rendering:** Leaflet is dynamically imported to avoid server-side rendering issues in Next.js.
- **SOS audit trail:** SOS actions are also stored as verified red-zone incidents so emergency events affect the safety map.

## ⚠️ Limitations

- This is not a certified emergency dispatch system.
- WhatsApp alerts are generated as links; the app does not guarantee message delivery.
- Evidence capture is local/browser-based in the current UI and is not uploaded to secure cloud storage.
- Some features depend on browser permissions: geolocation, motion sensors, camera, and microphone.
- News, weather, OSM, and OSRM data depend on external API availability and rate limits.
- Seed data and synthetic ML training data are used for demo readiness when real data is sparse.
- The current default database is SQLite, which is not ideal for multi-user production traffic.
- Clerk is used on the frontend, while the backend also contains local JWT auth routes; production auth should be unified.
- CORS, secrets, incident moderation, abuse prevention, and emergency compliance need hardening before public deployment.

## Future Improvements

- Replace SQLite with Postgres + PostGIS for production geospatial queries.
- Add secure evidence upload with encryption, retention policies, and access controls.
- Integrate real SMS, email, push notification, or emergency-service provider APIs.
- Add moderator/admin tools for verifying, rejecting, and escalating incidents.
- Use authenticated voting and anti-spam controls.
- Add WebSocket updates for live map and dashboard changes.
- Train the risk model on larger verified datasets and evaluate accuracy by region/time.
- Add route saving directly from the map workflow.
- Add multilingual reporting and accessibility improvements.
- Build deployment manifests for Docker, Vercel, and a cloud FastAPI host.

## Contributing

Contributions are welcome. For a clean workflow:

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Run backend checks and frontend lint/build.
5. Open a pull request with a clear description and screenshots for UI changes.

## License

No license file is currently included in this repository. Add a license such as MIT, Apache-2.0, or another license before publishing if you want others to reuse the code.

## Author

Built by **Gauri Mishra** ,**Jaya Chaturvedi**, **Ruchi**, and **Pragati Sagar** as a full-stack AI Women safety intelligence project.

For production use, review legal, privacy, security, emergency-response, and data-governance requirements before deploying.
