"""
Weather Service for AuroraSafe
Fetches real-time weather for Delhi NCR and translates it into a safety factor.
Uses OpenWeatherMap free tier (1000 req/day).
"""
import logging
import httpx
from datetime import datetime
from typing import Dict, Any, Optional

from config import settings

logger = logging.getLogger(__name__)

# In-memory cache to avoid hitting the API too often
_weather_cache: Dict[str, Any] = {}
_cache_timestamp: Optional[datetime] = None
CACHE_DURATION_SECONDS = 1800  # 30 minutes

# Delhi NCR cities with their approx coordinates
NCR_CITIES = {
    "Delhi":     {"lat": 28.6139, "lng": 77.2090},
    "Noida":     {"lat": 28.5355, "lng": 77.3910},
    "Ghaziabad": {"lat": 28.6692, "lng": 77.4538},
    "Gurugram":  {"lat": 28.4595, "lng": 77.0266},
    "Faridabad": {"lat": 28.4089, "lng": 77.3178},
}


def _compute_weather_factor(weather_data: Dict[str, Any]) -> float:
    """
    Translates raw weather into a safety multiplier (0.5 - 1.0).
    1.0 = perfect conditions, 0.5 = severe weather (very unsafe)
    """
    if not weather_data:
        return 1.0  # assume safe if no data

    weather_id = weather_data.get("weather_id", 800)  # 800 = clear sky
    visibility = weather_data.get("visibility", 10000)  # metres
    wind_speed = weather_data.get("wind_speed", 0)
    hour = datetime.now().hour

    factor = 1.0

    # Weather condition penalties
    if weather_id >= 200 and weather_id < 300:
        # Thunderstorm
        factor -= 0.30
    elif weather_id >= 300 and weather_id < 500:
        # Drizzle
        factor -= 0.10
    elif weather_id >= 500 and weather_id < 600:
        # Rain
        intensity = (weather_id - 500)
        factor -= 0.10 + (intensity * 0.02)  # heavier rain → worse
    elif weather_id >= 600 and weather_id < 700:
        # Snow (rare in Delhi, but possible)
        factor -= 0.20
    elif weather_id >= 700 and weather_id < 800:
        # Atmosphere: fog, haze, dust storm
        if weather_id in [711, 721, 731, 741, 751, 761, 762]:
            factor -= 0.25  # heavy fog/dust → very unsafe
        else:
            factor -= 0.15
    # 800 = clear, 801-804 = clouds → no major penalty

    # Low visibility penalty
    if visibility < 1000:
        factor -= 0.20  # severe fog
    elif visibility < 5000:
        factor -= 0.10

    # High wind penalty (dust storms common in Delhi summers)
    if wind_speed > 15:
        factor -= 0.05

    # Night-time multiplier (separate from weather, adds to it)
    # This is applied in the safety router, not here

    return max(0.40, round(factor, 2))


def _map_weather_condition(weather_id: int) -> str:
    """Human-readable weather condition label."""
    if weather_id < 300:
        return "thunderstorm"
    elif weather_id < 500:
        return "drizzle"
    elif weather_id < 600:
        return "rain"
    elif weather_id < 700:
        return "snow"
    elif weather_id < 800:
        if weather_id == 741:
            return "fog"
        elif weather_id in [761, 762]:
            return "dust storm"
        return "haze"
    elif weather_id == 800:
        return "clear"
    else:
        return "cloudy"


async def fetch_weather(city: str = None) -> Dict[str, Any]:
    """
    Fetch current weather for a given city from OpenWeatherMap.
    Returns a dict with weather info + safety_factor.
    """
    global _weather_cache, _cache_timestamp

    city = city or settings.DEFAULT_CITY

    # Check cache
    now = datetime.now()
    if (
        _cache_timestamp
        and (now - _cache_timestamp).total_seconds() < CACHE_DURATION_SECONDS
        and city in _weather_cache
    ):
        logger.debug(f"Weather cache hit for {city}")
        return _weather_cache[city]

    if not settings.OPENWEATHER_API_KEY:
        logger.warning("OPENWEATHER_API_KEY not set, returning neutral weather")
        return _neutral_weather(city)

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": f"{city},IN",
            "appid": settings.OPENWEATHER_API_KEY,
            "units": "metric"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        weather_id = data["weather"][0]["id"]
        weather_desc = data["weather"][0]["description"]
        temp = data["main"]["temp"]
        visibility = data.get("visibility", 10000)
        wind_speed = data["wind"]["speed"]
        humidity = data["main"]["humidity"]

        raw = {
            "weather_id": weather_id,
            "visibility": visibility,
            "wind_speed": wind_speed,
        }
        safety_factor = _compute_weather_factor(raw)
        condition = _map_weather_condition(weather_id)

        result = {
            "city": city,
            "condition": condition,
            "description": weather_desc,
            "temp_celsius": round(temp, 1),
            "humidity_pct": humidity,
            "visibility_m": visibility,
            "wind_speed_mps": wind_speed,
            "weather_id": weather_id,
            "safety_factor": safety_factor,
            "warning": _get_weather_warning(condition, safety_factor),
            "fetched_at": now.isoformat(),
        }

        # Cache it
        _weather_cache[city] = result
        _cache_timestamp = now

        logger.info(f"Weather for {city}: {condition}, safety_factor={safety_factor}")
        return result

    except httpx.HTTPError as e:
        logger.error(f"Weather API HTTP error for {city}: {e}")
        return _neutral_weather(city)
    except Exception as e:
        logger.error(f"Weather fetch failed for {city}: {e}")
        return _neutral_weather(city)


async def fetch_all_ncr_weather() -> Dict[str, Any]:
    """Fetch weather for all NCR cities and store in cache."""
    results = {}
    for city in NCR_CITIES.keys():
        results[city] = await fetch_weather(city)
    return results


def get_cached_weather(city: str = None) -> Optional[Dict[str, Any]]:
    """Return cached weather without making a network call."""
    city = city or settings.DEFAULT_CITY
    return _weather_cache.get(city)


def _neutral_weather(city: str) -> Dict[str, Any]:
    """Fallback when API is unavailable."""
    return {
        "city": city,
        "condition": "unknown",
        "description": "weather data unavailable",
        "temp_celsius": None,
        "humidity_pct": None,
        "visibility_m": 10000,
        "wind_speed_mps": 0,
        "weather_id": 800,
        "safety_factor": 1.0,
        "warning": None,
        "fetched_at": datetime.now().isoformat(),
    }


def _get_weather_warning(condition: str, factor: float) -> Optional[str]:
    """Return a user-facing warning string if conditions are poor."""
    if factor >= 0.9:
        return None
    warnings = {
        "fog": "⚠️ Dense fog alert — reduced visibility, avoid isolated routes",
        "dust storm": "⚠️ Dust storm in Delhi NCR — stay indoors if possible",
        "thunderstorm": "⚠️ Thunderstorm active — avoid open areas and isolated roads",
        "rain": "⚠️ Heavy rain — poor visibility, prefer busy lit streets",
        "haze": "⚠️ Poor air quality and visibility — take extra precautions",
    }
    return warnings.get(condition, f"⚠️ Adverse weather conditions — safety score reduced by {round((1-factor)*100)}%")
