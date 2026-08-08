import math
import numpy as np
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.incident import Incident
from schemas.route import RouteRequest, RouteResponse, Location
from routers.incidents import haversine

router = APIRouter()

def point_to_line_distance(p_lat, p_lng, a_lat, a_lng, b_lat, b_lng):
    # Returns distance from point P to line segment AB in km
    # Approximate using flat earth around the coordinates
    p = np.array([p_lat, p_lng])
    a = np.array([a_lat, a_lng])
    b = np.array([b_lat, b_lng])
    
    line_vec = b - a
    p_vec = p - a
    line_len_sq = np.dot(line_vec, line_vec)
    
    if line_len_sq == 0:
        return haversine(p_lat, p_lng, a_lat, a_lng)
        
    t = max(0, min(1, np.dot(p_vec, line_vec) / line_len_sq))
    proj = a + t * line_vec
    return haversine(p_lat, p_lng, proj[0], proj[1])

def _fallback_straight_line(origin, dest, red_zones):
    num_points = 10
    lats = np.linspace(origin.lat, dest.lat, num_points)
    lngs = np.linspace(origin.lng, dest.lng, num_points)
    waypoints = []
    avoided_zones = 0
    for i in range(num_points):
        lat = lats[i]
        lng = lngs[i]
        danger = False
        offset_lat = 0
        offset_lng = 0
        for rz in red_zones:
            dist = haversine(lat, lng, rz.latitude, rz.longitude)
            if dist < 0.3:
                danger = True
                vec_lat = lat - rz.latitude
                vec_lng = lng - rz.longitude
                norm = math.sqrt(vec_lat**2 + vec_lng**2)
                if norm > 0:
                    offset_lat += (vec_lat / norm) * 0.005 
                    offset_lng += (vec_lng / norm) * 0.005
                avoided_zones += 1
        if danger:
            waypoints.append(Location(lat=lat + offset_lat, lng=lng + offset_lng))
        else:
            waypoints.append(Location(lat=lat, lng=lng))
            
    total_dist = 0
    for i in range(len(waypoints)-1):
        total_dist += haversine(waypoints[i].lat, waypoints[i].lng, waypoints[i+1].lat, waypoints[i+1].lng)
        
    time_min = int((total_dist / 30.0) * 60)
    safety_score = max(0.0, 1.0 - (avoided_zones * 0.1))
    return RouteResponse(
        waypoints=waypoints,
        distance_km=round(total_dist, 2),
        estimated_time_min=time_min,
        safety_score=round(safety_score, 2),
        avoided_zones=avoided_zones,
        route_type="fallback_safest"
    )

@router.post("/safe", response_model=RouteResponse)
async def get_safe_route(request: RouteRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch red zones
    query = select(Incident).where(Incident.zone == "red")
    result = await db.execute(query)
    red_zones = result.scalars().all()
    
    origin = request.origin
    dest = request.destination
    
    # 2. Fetch real roads from OSRM router
    url = f"http://router.project-osrm.org/route/v1/driving/{origin.lng},{origin.lat};{dest.lng},{dest.lat}?alternatives=true&geometries=geojson"
    try:
        async with httpx.AsyncClient() as client:
            headers = {"User-Agent": "AuroraSafe/1.0 (contact@aurorasafe.local)"}
            resp = await client.get(url, timeout=10.0, headers=headers)
            data = resp.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                return _fallback_straight_line(origin, dest, red_zones)
    except Exception as e:
        return _fallback_straight_line(origin, dest, red_zones)
            
    routes = data["routes"]
    
    best_route_pts = []
    best_route_dist = 0
    best_route_time = 0
    min_penalty = float('inf')
    best_safety = 1.0
    best_avoided = 0
    
    # 3. Analyze options using A* Pathfinding Heuristics
    # In A* -> f(x) = g(x) + h(x)
    # g(x) -> Base physical cost (Distance in meters)
    # h(x) -> Heuristic penalty cost (Danger proximity to DBSCAN Red Zones)
    
    for r in routes:
        coords = r["geometry"]["coordinates"] # [[lng, lat]]
        dist_m = r.get("distance", 0)
        time_s = r.get("duration", 0)
        
        violations = 0
        avoided = 0
        
        for rz in red_zones:
            hit = False
            # Sample every 4th node to reduce computation time
            for i in range(0, len(coords), 4):
                lng, lat = coords[i]
                d = haversine(lat, lng, rz.latitude, rz.longitude)
                if d < 0.15:  # within 150m of a high-risk red zone
                    hit = True
                    break
            if hit:
                # Add severe penalty heuristic
                violations += 1
            else:
                avoided += 1
                
        # A* Cost Calculation:
        # g_x = Physical routing distance scaled mathematically
        g_x = dist_m / 100000.0 
        # h_x = Heuristic danger cost (each violation heavily weighs down the path)
        h_x = violations * 1.5 
        
        f_x = g_x + h_x  # Final A* Score
        
        if f_x < min_penalty:
            min_penalty = f_x
            best_route_pts = [Location(lat=c[1], lng=c[0]) for c in coords]
            best_route_dist = dist_m / 1000.0
            best_route_time = time_s / 60.0
            best_safety = max(0.0, 1.0 - (violations * 0.2))
            best_avoided = avoided
            
    return RouteResponse(
        waypoints=best_route_pts,
        distance_km=round(best_route_dist, 2),
        estimated_time_min=int(best_route_time),
        safety_score=round(best_safety, 2),
        avoided_zones=best_avoided,
        route_type="a_star_safest"
    )
