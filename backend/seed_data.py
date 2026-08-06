import numpy as np
from datetime import datetime, timedelta
import random

from database import AsyncSessionLocal
from models.incident import Incident

async def seed_incidents():
    neighborhoods = [
        {"name": "Connaught Place", "coords": (28.6304, 77.2177)},
        {"name": "Lajpat Nagar", "coords": (28.5677, 77.2433)},
        {"name": "Karol Bagh", "coords": (28.6519, 77.1895)},
        {"name": "Saket", "coords": (28.5245, 77.2066)},
        {"name": "Dwarka", "coords": (28.5823, 77.0500)},
        {"name": "Rohini", "coords": (28.7365, 77.1130)},
        {"name": "Sector 18, Noida", "coords": (28.5708, 77.3261)},
        {"name": "Sector 62, Noida", "coords": (28.6208, 77.3639)},
        {"name": "Indirapuram, Ghaziabad", "coords": (28.6415, 77.3714)},
        {"name": "Vaishali, Ghaziabad", "coords": (28.6412, 77.3374)}
    ]
    
    incident_templates = {
        "theft": ["Bag snatching reported near metro", "Mobile phone theft from e-rickshaw", "Pickpocket at busy market"],
        "assault": ["Physical altercation reported at bus stand", "Woman attacked in secluded alley", "Attempted mugging in park"],
        "harassment": ["Street harassment reported by cab driver", "Catcalling and verbal abuse by group of men", "Stalking reported near women's college"],
        "suspicious_activity": ["Suspicious person following women home", "Unknown vehicle parked overnight near hostel", "Men loitering near public washroom"],
        "vandalism": ["Street lights deliberately broken in alleyway", "Bus stop shelter damaged"],
        "accident": ["Minor vehicle collision outside mall", "Hit and run near crossing"]
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
        
        address = f"Near Landmark, {nhood['name']}, Delhi NCR"
        
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
            created_at=created_at,
            source="seed_data"
        )
        incidents.append(inc)
        
    async with AsyncSessionLocal() as db:
        db.add_all(incidents)
        await db.commit()
