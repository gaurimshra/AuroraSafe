from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config import settings
from database import init_db, AsyncSessionLocal
from routers import auth, incidents, safety, routes, sos, dashboard
from ml.risk_model import load_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AuroraSafe API...")
    await init_db()
    
    # Check if DB needs seeding
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
    logger.info("Startup complete.")
    
    yield
    # Shutdown
    logger.info("Shutting down AuroraSafe API...")

app = FastAPI(
    title="AuroraSafe API",
    description="AI-Powered Predictive Safety Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(safety.router, prefix="/safety", tags=["safety"])
app.include_router(routes.router, prefix="/routes", tags=["routes"])
app.include_router(sos.router, prefix="/sos", tags=["sos"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

@app.get("/")
async def root():
    return {"status": "ok", "service": "AuroraSafe API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "AuroraSafe is running"}
