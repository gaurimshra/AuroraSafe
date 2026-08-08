"""
Data Sources Router for AuroraSafe
Exposes endpoints to monitor and control the real-time data pipeline.
Great for hackathon demos — judges can watch the map update live!
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Response Models ──────────────────────────────────────────────────────────

class DataSourceStatus(BaseModel):
    scheduler_running: bool
    target_cities: List[str]
    news_api_configured: bool
    gnews_configured: bool
    openweather_configured: bool
    jobs: Dict[str, Any]
    timestamp: str


class WeatherResponse(BaseModel):
    city: str
    condition: str
    description: str
    temp_celsius: Optional[float]
    humidity_pct: Optional[int]
    visibility_m: Optional[int]
    wind_speed_mps: Optional[float]
    safety_factor: float
    warning: Optional[str]
    fetched_at: str


class TriggerResponse(BaseModel):
    message: str
    job: str
    result: Dict[str, Any]


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/status", response_model=DataSourceStatus)
async def get_data_source_status():
    """
    Returns current status of all real-time data pipelines.
    Shows last fetch times, counts, and any errors.
    """
    from services.scheduler import get_job_stats, _scheduler

    scheduler_running = bool(_scheduler and _scheduler.running)
    stats = get_job_stats()

    return DataSourceStatus(
        scheduler_running=scheduler_running,
        target_cities=settings.get_target_cities(),
        news_api_configured=bool(settings.NEWS_API_KEY),
        gnews_configured=bool(settings.GNEWS_API_KEY),
        openweather_configured=bool(settings.OPENWEATHER_API_KEY),
        jobs=stats,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.post("/trigger/news", response_model=TriggerResponse)
async def trigger_news_fetch():
    """
    Manually trigger a news fetch from NewsAPI + GNews.
    Useful for hackathon demos — run this and watch the map update!
    """
    try:
        from services.scheduler import trigger_news_fetch_now
        result = await trigger_news_fetch_now()
        return TriggerResponse(
            message="News fetch triggered successfully",
            job="news_fetch",
            result=result,
        )
    except Exception as e:
        logger.error(f"Manual news trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/weather", response_model=TriggerResponse)
async def trigger_weather_refresh():
    """Manually refresh weather data for all NCR cities."""
    try:
        from services.scheduler import trigger_weather_refresh_now
        result = await trigger_weather_refresh_now()
        return TriggerResponse(
            message="Weather refresh triggered successfully",
            job="weather_refresh",
            result=result,
        )
    except Exception as e:
        logger.error(f"Manual weather trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather", response_model=WeatherResponse)
async def get_current_weather(city: str = Query(default=None)):
    """
    Get current weather for a Delhi NCR city with its safety impact factor.
    safety_factor: 1.0 = perfect, 0.5 = severe adverse conditions
    """
    from services.weather_service import fetch_weather
    city = city or settings.DEFAULT_CITY
    weather = await fetch_weather(city)
    return WeatherResponse(**{k: weather[k] for k in WeatherResponse.model_fields})


@router.get("/weather/all")
async def get_all_ncr_weather():
    """Get weather for all Delhi NCR cities at once."""
    from services.weather_service import fetch_all_ncr_weather
    return await fetch_all_ncr_weather()


@router.get("/police-stations")
async def get_police_stations():
    """
    Returns police stations across Delhi NCR from OpenStreetMap.
    Data is fetched fresh from Overpass API (no key needed).
    Use for map overlay.
    """
    from services.osm_service import get_police_stations_in_ncr
    stations = await get_police_stations_in_ncr()
    return {
        "count": len(stations),
        "stations": stations,
        "source": "OpenStreetMap / Overpass API",
        "region": "Delhi NCR",
    }


@router.get("/ngos")
async def get_ngos():
    """
    Returns verified NGOs from local JSON.
    """
    import os
    import json
    ngo_file = os.path.join(os.path.dirname(__file__), "..", "data", "ngos.json")
    if os.path.exists(ngo_file):
        with open(ngo_file, "r") as f:
            return json.load(f)
    return []


@router.get("/nearby-pois")
async def get_nearby_pois(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_m: int = Query(default=500, le=2000, description="Search radius in metres"),
):
    """
    Returns safety-relevant POIs near a coordinate:
    police stations, hospitals, metro stations, bus stops, shops.
    Includes a safety_adjustment score based on what's nearby.
    """
    from services.osm_service import get_nearby_safety_pois
    result = await get_nearby_safety_pois(lat, lng, radius_m)
    return result


@router.get("/live-factors")
async def get_live_safety_factors(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    city: str = Query(default=None, description="City name for weather lookup"),
):
    """
    Returns a full breakdown of all live safety factors for a coordinate.
    Great for showing judges how the multi-source scoring works!

    Factors:
    - Historical incidents nearby
    - Recent news incidents (last 24h)
    - Current weather impact
    - Time of day impact
    - Nearest police station
    - POI density (metro, bus stops, shops)
    """
    from services.weather_service import fetch_weather
    from services.osm_service import get_nearby_safety_pois
    from database import AsyncSessionLocal
    from models.incident import Incident
    from sqlalchemy import select
    from routers.incidents import haversine
    import math

    city = city or settings.DEFAULT_CITY
    now = datetime.utcnow()
    hour = (now.hour + 5) % 24  # Approx IST hour

    # 1. Fetch weather
    weather = await fetch_weather(city)
    weather_factor = weather["safety_factor"]

    # 2. Fetch POIs (Overpass API — may time out, non-fatal)
    try:
        poi_data = await get_nearby_safety_pois(lat, lng, radius_m=500)
        poi_adjustment = poi_data["safety_adjustment"]
    except Exception:
        from services.osm_service import _empty_poi_result
        poi_data = _empty_poi_result(500)
        poi_adjustment = 0.0

    # 3. Time of day factor
    if 6 <= hour <= 9:
        time_factor = 0.90   # Morning commute - ok
        time_label = "morning"
    elif 9 <= hour <= 17:
        time_factor = 1.0    # Daytime - safest
        time_label = "daytime"
    elif 17 <= hour <= 20:
        time_factor = 0.85   # Evening rush
        time_label = "evening"
    elif 20 <= hour <= 22:
        time_factor = 0.65   # Night starts
        time_label = "night"
    else:
        time_factor = 0.45   # Late night / very early morning
        time_label = "late_night"

    # 4. Incidents from DB
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Incident).where(Incident.status.in_(["verified", "pending"]))
        )
        incidents = result.scalars().all()

    recent_cutoff = now - timedelta(hours=24)
    nearby_all = []
    nearby_recent = []

    for inc in incidents:
        dist = haversine(lat, lng, inc.latitude, inc.longitude)
        if dist <= 1.0:
            nearby_all.append(inc)
            if inc.created_at >= recent_cutoff:
                nearby_recent.append(inc)

    # Historical risk (0-1)
    if len(nearby_all) == 0:
        historical_risk = 0.1
    elif len(nearby_all) <= 3:
        historical_risk = 0.3
    elif len(nearby_all) <= 8:
        historical_risk = 0.6
    else:
        historical_risk = min(0.9, 0.6 + len(nearby_all) * 0.03)

    recent_boost = min(0.3, len(nearby_recent) * 0.1)

    # Composite safety score (higher = safer)
    base_safety = 1.0 - historical_risk - recent_boost
    final_safety = base_safety * weather_factor * time_factor + poi_adjustment
    final_safety = max(0.0, min(1.0, final_safety))

    zone = "green" if final_safety >= 0.65 else "yellow" if final_safety >= 0.35 else "red"

    return {
        "coordinates": {"lat": lat, "lng": lng},
        "final_safety_score": round(final_safety, 3),
        "zone": zone,
        "factors": {
            "historical_incidents": {
                "count_1km": len(nearby_all),
                "risk_contribution": round(historical_risk, 3),
                "label": "Based on incident history within 1km"
            },
            "recent_news": {
                "count_24h": len(nearby_recent),
                "risk_boost": round(recent_boost, 3),
                "label": "Incidents reported in last 24 hours (2x weighted)"
            },
            "weather": {
                "condition": weather["condition"],
                "safety_factor": weather_factor,
                "warning": weather.get("warning"),
                "label": f"Current weather: {weather['description']}"
            },
            "time_of_day": {
                "hour_ist": hour,
                "period": time_label,
                "safety_factor": time_factor,
                "label": f"Time penalty for {time_label}"
            },
            "infrastructure": {
                "poi_adjustment": poi_adjustment,
                "police_nearby": poi_data["has_police_nearby"],
                "metro_nearby": poi_data["has_metro_nearby"],
                "nearest_police_m": poi_data["nearest_police_m"],
                "nearest_police_name": poi_data["nearest_police_name"],
                "label": "Safety from nearby police, transport, public spaces"
            },
        },
        "sources": ["incident_db", "newsapi", "gnews", "openweathermap", "openstreetmap"],
        "timestamp": now.isoformat(),
    }
