import asyncio
import sys
sys.path.insert(0, '.')

async def main():
    from config import settings
    print("Cities:", settings.get_target_cities())
    print("NewsAPI:", bool(settings.NEWS_API_KEY))
    print("GNews:", bool(settings.GNEWS_API_KEY))
    print("Weather:", bool(settings.OPENWEATHER_API_KEY))

    from services.weather_service import fetch_weather
    w = await fetch_weather("Delhi")
    print("Delhi weather:", w["condition"], "temp:", w["temp_celsius"], "factor:", w["safety_factor"])
    if w.get("warning"):
        print("Warning:", w["warning"])

    from services.osm_service import geocode_address
    coords = await geocode_address("Connaught Place", "Delhi")
    print("Geocode Connaught Place:", coords)

    coords2 = await geocode_address("Sector 62", "Noida")
    print("Geocode Sector 62 Noida:", coords2)

    from services.weather_service import fetch_all_ncr_weather
    all_w = await fetch_all_ncr_weather()
    print("All NCR weather fetched:", list(all_w.keys()))

    print("\nAll service tests PASSED")

asyncio.run(main())
