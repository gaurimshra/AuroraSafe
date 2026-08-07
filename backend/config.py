from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    SECRET_KEY: str = "change-this-secret"
    DATABASE_URL: str = "sqlite+aiosqlite:///./aurorasafe.db"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "https://aurorasafe.vercel.app"]

    # Real-time Data Source Keys
    NEWS_API_KEY: str = ""
    GNEWS_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""

    # Target Region - Delhi NCR
    DEFAULT_CITY: str = "Delhi"
    DEFAULT_LAT: float = 28.6139
    DEFAULT_LNG: float = 77.2090
    TARGET_CITIES: str = "Delhi,Noida,Ghaziabad,Gurugram,Faridabad"

    # Scheduler Settings
    NEWS_FETCH_INTERVAL_MINUTES: int = 5
    WEATHER_REFRESH_INTERVAL_MINUTES: int = 30
    INCIDENT_EXPIRY_DAYS: int = 7

    def get_target_cities(self) -> List[str]:
        return [c.strip() for c in self.TARGET_CITIES.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
