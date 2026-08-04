import numpy as np
from datetime import datetime, timedelta
import random

from database import AsyncSessionLocal
from models.incident import Incident

async def seed_incidents():
    neighborhoods = [
        {"name": "Koramangala", "coords": (12.9352, 77.6245)},
        {"name": "MG Road", "coords": (12.9719, 77.5937)},
        {"name": "Marathahalli", "coords": (12.9580, 77.6513)},
        {"name": "Rajajinagar", "coords": (13.0012, 77.5553)},
        {"name": "Jayanagar", "coords": (12.9257, 77.5828)},
        {"name": "Indiranagar", "coords": (12.9784, 77.6408)},
        {"name": "HSR Layout", "coords": (12.9116, 77.6389)},
        {"name": "Whitefield", "coords": (12.9698, 77.7499)},
        {"name": "Banashankari", "coords": (12.9256, 77.5662)},
        {"name": "Electronic City", "coords": (12.8399, 77.6770)}
    ]
    
    incident_templates = {
        "theft": ["Bag snatching reported", "Mobile phone theft", "Pickpocket at market"],
        "assault": ["Physical altercation reported", "Person attacked near ATM"],
        "harassment": ["Street harassment reported", "Verbal abuse incident"],
        "suspicious_activity": ["Suspicious person loitering", "Unknown vehicle parked overnight"],
        "vandalism": ["Property damage reported", "Graffiti on public walls"],
        "accident": ["Road accident reported", "Minor vehicle collision"]
    }
    
    incidents = []
    rng = np.random.default_rng(42)
    
    for _ in range(120):
        nhood = random.choice(neighborhoods)
        lat = rng.normal(nhood["coords"][0], 0.005)
        lng = rng.normal(nhood["coords"][1], 0.005)
        
        inc_type = random.choice(list(incident_templates.keys()))
        summary = random.choice(incident_templates[inc_type])
        
        if inc_type in ["assault", "harassment"]:
            severity = int(rng.integers(6, 11))
        elif inc_type in ["theft", "vandalism", "accident"]:
            severity = int(rng.integers(4, 8))
        else:
            severity = int(rng.integers(1, 6))
            
        status_rand = random.random()
        if status_rand < 0.8:
            status = "verified"
        elif status_rand < 0.95:
            status = "pending"
        else:
            status = "rejected"
            
        days_ago = rng.integers(0, 30)
        created_at = datetime.utcnow() - timedelta(days=int(days_ago))
        
        if severity >= 7:
            zone = "red"
        elif severity >= 4:
            zone = "yellow"
        else:
            zone = "green"
            
        risk_score = min(1.0, max(0.0, severity / 10.0 + rng.normal(0, 0.1)))
        confidence = float(rng.uniform(0.6, 0.95))
        
        address = f"Near Landmark, {nhood['name']}, Bangalore"
        
        inc = Incident(
            latitude=float(lat),
            longitude=float(lng),
            description=summary,
            incident_type=inc_type,
            severity=severity,
            confidence=confidence,
            risk_score=risk_score,
            zone=zone,
            status=status,
            address=address,
            ai_summary=summary,
            created_at=created_at
        )
        incidents.append(inc)
        
    async with AsyncSessionLocal() as db:
        db.add_all(incidents)
        await db.commit()
