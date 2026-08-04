import math
import numpy as np
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

@router.post("/safe", response_model=RouteResponse)
async def get_safe_route(request: RouteRequest, db: AsyncSession = Depends(get_db)):
    # Simple routing algorithm around red zones
    query = select(Incident).where(Incident.zone == "red")
    result = await db.execute(query)
    red_zones = result.scalars().all()
    
    origin = request.origin
    dest = request.destination
    
    # Generate direct path points
    num_points = 10
    lats = np.linspace(origin.lat, dest.lat, num_points)
    lngs = np.linspace(origin.lng, dest.lng, num_points)
    
    waypoints = []
    avoided_zones = 0
    
    for i in range(num_points):
        lat = lats[i]
        lng = lngs[i]
        
        # Check nearby red zones
        danger = False
        offset_lat = 0
        offset_lng = 0
        
        for rz in red_zones:
            dist = haversine(lat, lng, rz.latitude, rz.longitude)
            if dist < 0.3:  # If within 300m of red zone
                danger = True
                # Move away perpendicularly (approximate)
                vec_lat = lat - rz.latitude
                vec_lng = lng - rz.longitude
                norm = math.sqrt(vec_lat**2 + vec_lng**2)
                if norm > 0:
                    offset_lat += (vec_lat / norm) * 0.005 # ~500m offset
                    offset_lng += (vec_lng / norm) * 0.005
                avoided_zones += 1
                
        if danger:
            waypoints.append(Location(lat=lat + offset_lat, lng=lng + offset_lng))
        else:
            waypoints.append(Location(lat=lat, lng=lng))
            
    # Calculate total distance
    total_dist = 0
    for i in range(len(waypoints)-1):
        total_dist += haversine(
            waypoints[i].lat, waypoints[i].lng,
            waypoints[i+1].lat, waypoints[i+1].lng
        )
        
    # Assume 30km/h average speed in city
    time_min = int((total_dist / 30.0) * 60)
    
    # Safety score
    safety_score = max(0.0, 1.0 - (avoided_zones * 0.1))
    
    return RouteResponse(
        waypoints=waypoints,
        distance_km=round(total_dist, 2),
        estimated_time_min=time_min,
        safety_score=round(safety_score, 2),
        avoided_zones=avoided_zones,
        route_type="safest"
    )
