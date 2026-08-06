from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config import settings
from database import init_db, AsyncSessionLocal
from routers import auth, incidents, safety, routes, sos, dashboard
from routers import data_sources, saved_routes
from ml.risk_model import load_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────
    logger.info("Starting AuroraSafe API...")
    await init_db()

    # Seed DB if empty
    from models.incident import Incident
    from sqlalchemy import select, func
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(Incident))
        count = result.scalar()
        if count == 0:
            logger.info("Seeding database with sample data...")
            from seed_data import seed_incidents
            await seed_incidents()
            logger.info("Database seeded.")

    # Load/train ML model
    logger.info("Loading risk model...")
    load_model()
    logger.info("ML model ready.")

    # Warm up weather cache on boot
    logger.info("Fetching initial weather for Delhi NCR...")
    try:
        from services.weather_service import fetch_all_ncr_weather
        await fetch_all_ncr_weather()
        logger.info("Weather cache warm.")
    except Exception as e:
        logger.warning(f"Initial weather fetch failed (non-fatal): {e}")

    # Start background scheduler (news fetch, weather refresh, cleanup)
    logger.info("Starting background data scheduler...")
    from services.scheduler import start_scheduler, trigger_news_fetch_now
    start_scheduler()

    # Trigger one immediate news fetch so the map has live data right away
    logger.info("Triggering initial news fetch...")
    try:
        await trigger_news_fetch_now()
    except Exception as e:
        logger.warning(f"Initial news fetch failed (non-fatal): {e}")

    logger.info("✅ AuroraSafe API startup complete — real-time pipeline active!")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    logger.info("Shutting down AuroraSafe API...")
    from services.scheduler import stop_scheduler
    stop_scheduler()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="AuroraSafe API",
    description="AI-Powered Predictive Safety Intelligence Platform — Delhi NCR",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/auth",         tags=["auth"])
app.include_router(incidents.router,    prefix="/incidents",    tags=["incidents"])
app.include_router(safety.router,       prefix="/safety",       tags=["safety"])
app.include_router(routes.router,       prefix="/routes",       tags=["routes"])
app.include_router(sos.router,          prefix="/sos",          tags=["sos"])
app.include_router(dashboard.router,    prefix="/dashboard",    tags=["dashboard"])
app.include_router(data_sources.router, prefix="/data-sources", tags=["data-sources"])
app.include_router(saved_routes.router, prefix="/saved-routes", tags=["saved-routes"])


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "AuroraSafe API",
        "version": "2.0.0",
        "region": "Delhi NCR",
        "pipeline": "active",
        "sources": ["newsapi", "gnews", "openweathermap", "openstreetmap", "user_reports"],
    }

@app.get("/health")
async def health():
    from services.scheduler import _scheduler, get_job_stats
    stats = get_job_stats()
    return {
        "status": "healthy",
        "scheduler": "running" if (_scheduler and _scheduler.running) else "stopped",
        "last_news_fetch": stats["news_fetch"]["last_run"],
        "total_news_inserted": stats["news_fetch"]["total_inserted"],
    }
