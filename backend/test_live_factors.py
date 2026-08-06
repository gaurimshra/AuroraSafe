import asyncio
import sys
sys.path.insert(0, '.')

async def test_live_factors():
    """Test the live factors logic directly without HTTP."""
    from datetime import datetime, timedelta
    from config import settings
    from services.weather_service import fetch_weather
    from services.osm_service import get_nearby_safety_pois
    from database import AsyncSessionLocal
    from models.incident import Incident
    from sqlalchemy import select
    from routers.incidents import haversine

    lat, lng = 28.6139, 77.2090
    city = "Delhi"
    now = datetime.utcnow()
    hour = (now.hour + 5) % 24

    print(f"IST hour: {hour}")

    print("Fetching weather...")
    weather = await fetch_weather(city)
    print(f"Weather: {weather['condition']}, factor={weather['safety_factor']}")

    print("Fetching POIs (Overpass API)...")
    poi_data = await get_nearby_safety_pois(lat, lng, radius_m=500)
    print(f"POI adjustment: {poi_data['safety_adjustment']}")
    print(f"Police nearby: {poi_data['has_police_nearby']}")

    print("Querying DB...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Incident).where(Incident.status.in_(["verified", "pending"]))
        )
        incidents = result.scalars().all()

    print(f"Total incidents in DB: {len(incidents)}")

    recent_cutoff = now - timedelta(hours=24)
    nearby_all = []
    nearby_recent = []

    for inc in incidents:
        dist = haversine(lat, lng, inc.latitude, inc.longitude)
        if dist <= 1.0:
            nearby_all.append(inc)
            if inc.created_at >= recent_cutoff:
                nearby_recent.append(inc)

    print(f"Nearby incidents (1km): {len(nearby_all)}")
    print(f"Recent (24h): {len(nearby_recent)}")
    print("Live factors test PASSED")

asyncio.run(test_live_factors())
