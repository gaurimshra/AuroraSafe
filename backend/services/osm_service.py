"""
OpenStreetMap / Overpass API Service for AuroraSafe
Finds nearby police stations, hospitals, bus stops, metro stations.
Completely free — no API key required.
"""
import logging
import httpx
import math
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

# How these affect safety score
SAFETY_FACTORS = {
    "police":     +0.15,   # Nearby police → safer
    "hospital":   +0.08,   # Nearby hospital → somewhat safer
    "bus_stop":   +0.05,   # Public transport → more people around
    "metro":      +0.10,   # Metro station → well-lit, busy
    "atm":        +0.03,   # ATMs usually have cameras
    "shop":       +0.04,   # Open shops = activity = safer
}

UNSAFE_FACTORS = {
    "park_isolated": -0.10,  # Isolated parks
    "cemetery":      -0.12,  # Cemeteries
    "industrial":    -0.08,  # Industrial areas
}


async def geocode_address(address: str, city: str = "Delhi NCR") -> Optional[Dict[str, float]]:
    """
    Convert an address string to lat/lng using Nominatim (free OSM geocoder).
    Returns {"lat": float, "lng": float} or None if not found.
    """
    try:
        params = {
            "q": f"{address}, {city}, India",
            "format": "json",
            "limit": 1,
            "countrycodes": "in",
        }
        headers = {"User-Agent": "AuroraSafe/1.0 (women-safety-hackathon)"}

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(NOMINATIM_URL, params=params, headers=headers)
            response.raise_for_status()
            results = response.json()

        if not results:
            logger.warning(f"Geocoding failed for: {address}")
            return None

        r = results[0]
        lat, lng = float(r["lat"]), float(r["lon"])

        # Sanity check — must be within Delhi NCR bounding box
        # ~28.0 to 29.0 lat, 76.8 to 77.8 lng
        if 27.0 <= lat <= 30.0 and 76.0 <= lng <= 78.5:
            logger.info(f"Geocoded '{address}' → {lat},{lng}")
            return {"lat": lat, "lng": lng}
        else:
            logger.warning(f"Geocoded location outside NCR: {lat},{lng} for '{address}'")
            return None

    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {e}")
        return None


async def reverse_geocode(lat: float, lng: float) -> str:
    """Convert lat/lng back to a human-readable address."""
    try:
        params = {
            "lat": lat,
            "lon": lng,
            "format": "json",
        }
        headers = {"User-Agent": "AuroraSafe/1.0 (women-safety-hackathon)"}
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(NOMINATIM_REVERSE_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
        return data.get("display_name", f"{lat:.4f},{lng:.4f}")
    except Exception:
        return f"{lat:.4f},{lng:.4f}"


async def get_nearby_safety_pois(
    lat: float,
    lng: float,
    radius_m: int = 500
) -> Dict[str, Any]:
    """
    Query Overpass API for safety-relevant POIs within radius_m metres.
    Returns a structured dict with POI counts + safety_adjustment score.
    """
    # Build Overpass QL query
    query = f"""
[out:json][timeout:10];
(
  node["amenity"="police"](around:{radius_m},{lat},{lng});
  node["amenity"="hospital"](around:{radius_m},{lat},{lng});
  node["amenity"="clinic"](around:{radius_m},{lat},{lng});
  node["highway"="bus_stop"](around:{radius_m},{lat},{lng});
  node["railway"="station"](around:{radius_m},{lat},{lng});
  node["amenity"="bank"](around:{radius_m},{lat},{lng});
  node["amenity"="atm"](around:{radius_m},{lat},{lng});
  node["shop"](around:{radius_m},{lat},{lng});
);
out body;
""".strip()

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            data = response.json()

        elements = data.get("elements", [])

        # Categorize POIs
        pois: Dict[str, List[Dict]] = {
            "police": [],
            "hospital": [],
            "bus_stop": [],
            "metro": [],
            "atm": [],
            "shop": [],
        }

        for el in elements:
            tags = el.get("tags", {})
            amenity = tags.get("amenity", "")
            highway = tags.get("highway", "")
            railway = tags.get("railway", "")

            poi_info = {
                "name": tags.get("name", "Unknown"),
                "lat": el.get("lat", lat),
                "lng": el.get("lon", lng),
            }
            poi_info["distance_m"] = int(_haversine_m(
                lat, lng, poi_info["lat"], poi_info["lng"]
            ))

            if amenity == "police":
                pois["police"].append(poi_info)
            elif amenity in ("hospital", "clinic"):
                pois["hospital"].append(poi_info)
            elif highway == "bus_stop":
                pois["bus_stop"].append(poi_info)
            elif railway == "station" or "metro" in tags.get("name", "").lower():
                pois["metro"].append(poi_info)
            elif amenity in ("atm", "bank"):
                pois["atm"].append(poi_info)
            elif "shop" in tags or amenity in ("marketplace", "convenience"):
                pois["shop"].append(poi_info)

        # Compute safety adjustment
        adjustment = 0.0
        for poi_type, poi_list in pois.items():
            if poi_list and poi_type in SAFETY_FACTORS:
                # Only count the closest one for max benefit
                adjustment += SAFETY_FACTORS[poi_type]

        # Cap at +0.35
        adjustment = min(0.35, round(adjustment, 3))

        nearest_police = min(
            pois["police"], key=lambda x: x["distance_m"], default=None
        )

        return {
            "pois": pois,
            "poi_counts": {k: len(v) for k, v in pois.items()},
            "safety_adjustment": adjustment,
            "nearest_police_m": nearest_police["distance_m"] if nearest_police else None,
            "nearest_police_name": nearest_police["name"] if nearest_police else None,
            "has_police_nearby": bool(pois["police"]),
            "has_metro_nearby": bool(pois["metro"]),
            "has_hospital_nearby": bool(pois["hospital"]),
            "radius_m": radius_m,
        }

    except httpx.TimeoutException:
        logger.warning(f"Overpass API timeout for ({lat},{lng})")
        return _empty_poi_result(radius_m)
    except Exception as e:
        logger.error(f"Overpass API error for ({lat},{lng}): {e}")
        return _empty_poi_result(radius_m)


async def get_police_stations_in_ncr() -> List[Dict[str, Any]]:
    """
    Fetch all police stations in Delhi NCR bounding box.
    Used to preload the map with police station markers.
    """
    # Delhi NCR bounding box
    query = """
[out:json][timeout:20];
(
  node["amenity"="police"](28.0,76.8,29.1,77.8);
  way["amenity"="police"](28.0,76.8,29.1,77.8);
);
out center;
""".strip()

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            data = response.json()

        stations = []
        for el in data.get("elements", []):
            tags = el.get("tags", {})
            # Handle both node and way (way has 'center')
            if el["type"] == "node":
                lat, lng = el.get("lat"), el.get("lon")
            else:
                center = el.get("center", {})
                lat, lng = center.get("lat"), center.get("lon")

            if lat and lng:
                stations.append({
                    "name": tags.get("name", tags.get("name:en", "Police Station")),
                    "lat": lat,
                    "lng": lng,
                    "phone": tags.get("phone", tags.get("contact:phone", None)),
                    "ref": tags.get("ref", None),
                })

        logger.info(f"Fetched {len(stations)} police stations in Delhi NCR")
        return stations

    except Exception as e:
        logger.error(f"Police stations fetch failed: {e}")
        return []


def _haversine_m(lat1, lon1, lat2, lon2) -> float:
    """Distance in metres between two coordinates."""
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2)
    return R * 2 * math.asin(math.sqrt(a))


def _empty_poi_result(radius_m: int) -> Dict[str, Any]:
    return {
        "pois": {k: [] for k in ["police", "hospital", "bus_stop", "metro", "atm", "shop"]},
        "poi_counts": {k: 0 for k in ["police", "hospital", "bus_stop", "metro", "atm", "shop"]},
        "safety_adjustment": 0.0,
        "nearest_police_m": None,
        "nearest_police_name": None,
        "has_police_nearby": False,
        "has_metro_nearby": False,
        "has_hospital_nearby": False,
        "radius_m": radius_m,
    }
