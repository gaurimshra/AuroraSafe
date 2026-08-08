import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import DBSCAN
import logging

logger = logging.getLogger(__name__)

def detect_hotspots(incidents: List[Dict]) -> List[Dict[str, Any]]:
    """
    Use DBSCAN to detect unsafe hotspot clusters from incident data.
    incidents: list of dicts with 'latitude', 'longitude', 'risk_score', 'incident_type'
    Returns list of hotspot zone dicts.
    """
    if len(incidents) < 3:
        return []
    
    coords = np.array([[inc['latitude'], inc['longitude']] for inc in incidents])
    
    # eps=1.5/6371.0 ~= 0.000235 (1.5km in radians), min_samples=3 for a cluster
    # Use haversine metric for geographic accuracy
    coords_rad = np.radians(coords)
    # Earth radius ~ 6371km. Target hotspot cluster radius: 1.5km
    db = DBSCAN(eps=1.5/6371.0, min_samples=4, algorithm='ball_tree', metric='haversine').fit(coords_rad)
    
    labels = db.labels_
    unique_labels = set(labels) - {-1}  # -1 is noise
    
    hotspots = []
    for label in unique_labels:
        mask = labels == label
        cluster_points = [incidents[i] for i in range(len(incidents)) if mask[i]]
        cluster_coords = coords[mask]
        
        center_lat = float(np.mean(cluster_coords[:, 0]))
        center_lng = float(np.mean(cluster_coords[:, 1]))
        
        # Calculate radius (max distance from center in km)
        distances = np.sqrt(
            ((cluster_coords[:, 0] - center_lat) * 111) ** 2 +
            ((cluster_coords[:, 1] - center_lng) * 111 * np.cos(np.radians(center_lat))) ** 2
        )
        radius_km = float(np.max(distances)) if len(distances) > 0 else 0.5
        radius_km = max(0.3, min(5.0, radius_km))  # clamp between 300m and 5km
        
        avg_risk = np.mean([inc.get('risk_score', 0.5) for inc in cluster_points])
        avg_severity = np.mean([inc.get('severity', 5) for inc in cluster_points])
        
        # Determine risk level
        combined = (avg_risk * 0.6 + (avg_severity / 10) * 0.4)
        if combined >= 0.65:
            risk_level = "red"
        elif combined >= 0.4:
            risk_level = "yellow"
        else:
            risk_level = "green"
        
        # Find dominant incident type
        types = [inc.get('incident_type', 'other') for inc in cluster_points]
        dominant_type = max(set(types), key=types.count)
        
        hotspots.append({
            "lat": center_lat,
            "lng": center_lng,
            "radius": radius_km,
            "risk_level": risk_level,
            "incident_count": len(cluster_points),
            "dominant_type": dominant_type,
            "avg_severity": float(avg_severity),
            "avg_risk_score": float(avg_risk)
        })
    
    # Sort by risk level then count
    risk_order = {"red": 0, "yellow": 1, "green": 2}
    hotspots.sort(key=lambda x: (risk_order.get(x['risk_level'], 3), -x['incident_count']))
    return hotspots
