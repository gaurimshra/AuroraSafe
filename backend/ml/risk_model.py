import numpy as np
import pickle
import os
import logging
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')

# Global model instance
_model = None
_training_incidents = []

def _generate_training_data(incidents: List[Dict] = None):
    """Generate or use real training data for XGBoost."""
    import pandas as pd
    
    rows = []
    
    # Use real incident data if available
    if incidents:
        for inc in incidents:
            hour = datetime.utcnow().hour  # simplified
            rows.append({
                'lat': inc['latitude'],
                'lng': inc['longitude'],
                'hour': hour,
                'day_of_week': datetime.utcnow().weekday(),
                'severity': inc.get('severity', 5),
                'incident_type_encoded': _encode_type(inc.get('incident_type', 'other')),
                'risk_score': inc.get('risk_score', 0.5)
            })
    
    # Add synthetic training data to ensure model robustness
    # Bangalore high-risk areas (synthetic)
    rng = np.random.default_rng(42)
    n_synthetic = 500
    
    # High-risk zones around Bangalore
    high_risk_centers = [
        (12.9352, 77.6245), (12.9719, 77.5937), (12.9580, 77.6513),
        (13.0012, 77.5553), (12.9000, 77.5700)
    ]
    low_risk_centers = [
        (12.9950, 77.6900), (12.9100, 77.6400), (13.0200, 77.5800),
        (12.9400, 77.5200), (12.9700, 77.7100)
    ]
    
    for center in high_risk_centers:
        n = n_synthetic // len(high_risk_centers)
        lats = rng.normal(center[0], 0.01, n)
        lngs = rng.normal(center[1], 0.01, n)
        hours = rng.integers(18, 24, n)  # evening/night = higher risk
        for i in range(n):
            rows.append({
                'lat': lats[i], 'lng': lngs[i],
                'hour': int(hours[i]),
                'day_of_week': int(rng.integers(0, 7)),
                'severity': int(rng.integers(6, 11)),
                'incident_type_encoded': int(rng.integers(0, 3)),
                'risk_score': float(rng.uniform(0.6, 1.0))
            })
    
    for center in low_risk_centers:
        n = n_synthetic // len(low_risk_centers)
        lats = rng.normal(center[0], 0.01, n)
        lngs = rng.normal(center[1], 0.01, n)
        hours = rng.integers(6, 18, n)  # daytime = lower risk
        for i in range(n):
            rows.append({
                'lat': lats[i], 'lng': lngs[i],
                'hour': int(hours[i]),
                'day_of_week': int(rng.integers(0, 7)),
                'severity': int(rng.integers(1, 5)),
                'incident_type_encoded': int(rng.integers(3, 7)),
                'risk_score': float(rng.uniform(0.0, 0.4))
            })
    
    return pd.DataFrame(rows)

def _encode_type(incident_type: str) -> int:
    mapping = {'assault': 0, 'theft': 1, 'harassment': 2, 'vandalism': 3,
               'suspicious_activity': 4, 'accident': 5, 'other': 6}
    return mapping.get(incident_type, 6)

def train_model(incidents: List[Dict] = None):
    """Train XGBoost risk model on CPU. No GPU needed."""
    global _model
    try:
        import xgboost as xgb
        
        df = _generate_training_data(incidents)
        
        features = ['lat', 'lng', 'hour', 'day_of_week', 'severity', 'incident_type_encoded']
        X = df[features].values
        y = df['risk_score'].values
        
        # CPU-only XGBoost
        _model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            tree_method='hist',  # CPU-only, fast
            device='cpu',
            random_state=42
        )
        _model.fit(X, y)
        
        # Save model
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(_model, f)
        logger.info("XGBoost risk model trained and saved.")
    except Exception as e:
        logger.error(f"Failed to train risk model: {e}")
        _model = None

def load_model():
    """Load existing model or train a new one."""
    global _model
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                _model = pickle.load(f)
            logger.info("Loaded existing risk model.")
            return
        except Exception:
            pass
    train_model()

def predict_risk(lat: float, lng: float, hour: Optional[int] = None, 
                 day_of_week: Optional[int] = None) -> Dict:
    """Predict risk score for a location."""
    global _model
    
    if hour is None:
        hour = datetime.utcnow().hour
    if day_of_week is None:
        day_of_week = datetime.utcnow().weekday()
    
    if _model is None:
        # Fallback: simple distance-based risk
        risk_score = 0.5
        confidence = 0.3
    else:
        try:
            features = np.array([[lat, lng, hour, day_of_week, 5, 6]])
            risk_score = float(np.clip(_model.predict(features)[0], 0.0, 1.0))
            confidence = 0.8
        except Exception as e:
            logger.error(f"Risk prediction failed: {e}")
            risk_score = 0.5
            confidence = 0.3
    
    if risk_score >= 0.65:
        zone = "red"
        message = "High risk area. Avoid if possible and stay alert."
    elif risk_score >= 0.35:
        zone = "yellow"
        message = "Moderate risk. Exercise caution in this area."
    else:
        zone = "green"
        message = "Low risk area. Relatively safe, stay aware."
    
    return {
        "score": round(risk_score, 3),
        "confidence": round(confidence, 3),
        "zone": zone,
        "message": message
    }
