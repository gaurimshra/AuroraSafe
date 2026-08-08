import numpy as np
from datetime import datetime, timedelta
import random

from database import AsyncSessionLocal
from models.incident import Incident

async def seed_incidents():
    # Delhi NCR Red/Yellow Zones for realistic clustering
    neighborhoods = [
        {"name": "Connaught Place", "coords": (28.6304, 77.2177), "risk_bias": 0.3},
        {"name": "Seelampur (Police Record Hotline)", "coords": (28.6640, 77.2584), "risk_bias": 0.8},
        {"name": "Okhla Industrial Estate", "coords": (28.5355, 77.2803), "risk_bias": 0.6},
        {"name": "Dwarka Sector 21 Metro", "coords": (28.5523, 77.0583), "risk_bias": 0.5},
        {"name": "Saket District Centre", "coords": (28.5245, 77.2066), "risk_bias": 0.4},
        {"name": "Noida Sector 15 Metro (Transport Logs)", "coords": (28.5786, 77.3150), "risk_bias": 0.5},
        {"name": "Ghaziabad Railway Station", "coords": (28.6515, 77.4262), "risk_bias": 0.7},
        {"name": "Vasant Kunj (Safe Zone)", "coords": (28.5293, 77.1557), "risk_bias": 0.2},
        {"name": "Gurgaon Cyber Hub", "coords": (28.4950, 77.0895), "risk_bias": 0.3},
        {"name": "Uttam Nagar East (City Safety)", "coords": (28.6212, 77.0664), "risk_bias": 0.6},
        {"name": "Karol Bagh Market", "coords": (28.6519, 77.1895), "risk_bias": 0.5},
        {"name": "Paharganj (Street Light Outages)", "coords": (28.6425, 77.2119), "risk_bias": 0.9},
        {"name": "Lajpat Nagar Central Market", "coords": (28.5677, 77.2433), "risk_bias": 0.4},
        {"name": "Noida Sector 62 (High Risk Hotspot)", "coords": (28.6280, 77.3649), "risk_bias": 0.85},
        {"name": "Indirapuram, Ghaziabad", "coords": (28.6415, 77.3714), "risk_bias": 0.65},
        {"name": "Greater Noida West", "coords": (28.5833, 77.4333), "risk_bias": 0.55}
    ]
    
    incident_templates = {
        "theft": [
            "Bag snatching reported near metro exit.", 
            "Mobile phone theft from e-rickshaw (Police File 892-A).", 
            "Pickpocketing at dense public transit stop.",
            "Vehicle break-in overnight (City Watch).",
            "Wallet stolen during rush hour transit."
        ],
        "assault": [
            "Physical altercation recorded on CCTV near station.", 
            "Woman attacked in unlit alleyway (Reported to local precinct).", 
            "Attempted mugging in secluded park area at night.",
            "Violent robbery near ATM kiosk.",
            "Gang dispute causing panic in market street."
        ],
        "harassment": [
            "Street harassment reported by cab passenger.", 
            "Catcalling and verbal abuse by group of men at bus stop.", 
            "Stalking reported near women's college (Priority Report).",
            "Unwanted physical advances in crowded metro.",
            "Repeated verbal threats reported."
        ],
        "suspicious_activity": [
            "Suspicious person following women home repeatedly.", 
            "Unknown vehicle parked overnight near hostel (Neighborhood Watch).", 
            "Men loitering near public washroom with no lighting.",
            "Individuals observed scouting residential gates.",
            "Unauthorized gathering drinking alcohol in public park."
        ],
        "vandalism": [
            "Street lights deliberately broken to create dark spot (Municipal Log).", 
            "Bus stop shelter destroyed.",
            "CCTV cameras damaged maliciously.",
            "Public infrastructure defaced."
        ],
        "accident": [
            "Minor vehicle collision outside mall (Traffic Unit).", 
            "Hit and run near pedestrian crossing.",
            "Two-wheeler skidded due to terrible road conditions.",
            "Traffic signal malfunction resulting in crash."
        ]
    }
    
    incidents = []
    rng = np.random.default_rng(42)
    
    # Generate 800 incidents for deeper ML clustering structure and authentic database history
    for i in range(800):
        nhood = random.choice(neighborhoods)
        
        # Dense spatial scattering
        lat = rng.normal(nhood["coords"][0], 0.015)
        lng = rng.normal(nhood["coords"][1], 0.015)
        
        inc_type = random.choice(list(incident_templates.keys()))
        summary = random.choice(incident_templates[inc_type])
        
        # Apply strict severity based on crime
        if inc_type == "assault":
            severity = int(rng.integers(7, 11))
        elif inc_type == "harassment":
            severity = int(rng.integers(5, 9))
        elif inc_type == "theft":
            severity = int(rng.integers(4, 7))
        elif inc_type in ["vandalism", "accident"]:
            severity = int(rng.integers(3, 7))
        else:
            severity = int(rng.integers(1, 4))
            
        # Push severity up if it's in a known high-risk hotspot
        if nhood["risk_bias"] > 0.6:
            severity = min(10, severity + int(rng.integers(1, 3)))
            
        status_rand = random.random()
        # High verification rate to look like a mature platform
        if status_rand < 0.85:
            status = "verified"
        elif status_rand < 0.98:
            status = "pending"
        else:
            status = "rejected"
            
        # Push 85% of data into the last 14 days to ensure the dashboard graphs are completely full
        if random.random() < 0.85:
            days_ago = rng.integers(0, 14)
        else:
            days_ago = rng.integers(14, 45) # 45 days of memory
            
        hour = rng.integers(0, 24)
        created_at = datetime.utcnow() - timedelta(days=int(days_ago), hours=int(hour))
        
        # Direct relationship mapped onto zone
        if severity >= 7:
            zone = "red"
        elif severity >= 4:
            zone = "yellow"
        else:
            zone = "green"
            
        # Source mapping for credibility
        sources = ["Police Records", "Public Transport Logs", "City Safety Sensors", "Community Report", "NewsAPI"]
        if "Police" in summary or "CCTV" in summary:
            source = "police_db"
        elif "Transit" in summary or "metro" in summary or "bus" in summary:
            source = "transit_api"
        elif "Municipal" in summary or "Street light" in summary:
            source = "city_sensors"
        else:
            source = "user_report" if rng.random() > 0.3 else "newsapi"
            
        # The ML engine uses risk_score for maps
        risk_score = min(1.0, max(0.1, severity / 10.0 + rng.normal(0, 0.05)))
        confidence = float(rng.uniform(0.7, 0.99))
        
        address = f"Near {nhood['name']}"
        
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
            source=source,
            upvotes=int(rng.integers(0, 45)) if status == "verified" else int(rng.integers(0, 3))
        )
        incidents.append(inc)
        
    async with AsyncSessionLocal() as db:
        # Wipe old demo seeds if any (optional, but good for fresh DB)
        db.add_all(incidents)
        await db.commit()

