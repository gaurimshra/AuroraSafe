"""
APScheduler Background Jobs for AuroraSafe
Runs  automated data fetching tasks at configured intervals.
Integrated into FastAPI lifespan — starts on app boot, shuts down cleanly.
"""
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from config import settings

logger = logging.getLogger(__name__)

# Singleton scheduler instance
_scheduler: Optional[AsyncIOScheduler] = None

# Runtime stats — visible via /data-sources/status endpoint
_job_stats: Dict[str, Any] = {
    "news_fetch": {
        "last_run": None,
        "last_result": None,
        "run_count": 0,
        "total_inserted": 0,
        "errors": 0,
        "status": "pending",
    },
    "weather_refresh": {
        "last_run": None,
        "last_result": None,
        "run_count": 0,
        "errors": 0,
        "status": "pending",
    },
    "cleanup": {
        "last_run": None,
        "run_count": 0,
        "errors": 0,
        "status": "pending",
    },
}


# ── Job Functions ────────────────────────────────────────────────────────────

async def _job_fetch_news():
    """Scheduled job: fetch crime news from NewsAPI + GNews → DB."""
    logger.info("⏰ Scheduler: Starting news fetch job...")
    _job_stats["news_fetch"]["status"] = "running"
    _job_stats["news_fetch"]["last_run"] = datetime.utcnow().isoformat()

    try:
        from services.news_fetcher import fetch_and_ingest_news
        stats = await fetch_and_ingest_news()

        _job_stats["news_fetch"]["last_result"] = stats
        _job_stats["news_fetch"]["run_count"] += 1
        _job_stats["news_fetch"]["total_inserted"] += stats.get("inserted", 0)
        _job_stats["news_fetch"]["status"] = "ok"
        logger.info(f"⏰ News job done: {stats}")

    except Exception as e:
        logger.error(f"⏰ News fetch job FAILED: {e}")
        _job_stats["news_fetch"]["errors"] += 1
        _job_stats["news_fetch"]["status"] = "error"
        _job_stats["news_fetch"]["last_result"] = {"error": str(e)}


async def _job_refresh_weather():
    """Scheduled job: refresh weather for all NCR cities."""
    logger.info("⏰ Scheduler: Refreshing weather...")
    _job_stats["weather_refresh"]["status"] = "running"
    _job_stats["weather_refresh"]["last_run"] = datetime.utcnow().isoformat()

    try:
        from services.weather_service import fetch_all_ncr_weather
        weather = await fetch_all_ncr_weather()

        _job_stats["weather_refresh"]["last_result"] = {
            city: {"condition": w["condition"], "safety_factor": w["safety_factor"]}
            for city, w in weather.items()
        }
        _job_stats["weather_refresh"]["run_count"] += 1
        _job_stats["weather_refresh"]["status"] = "ok"
        logger.info(f"⏰ Weather refreshed for {len(weather)} cities")

    except Exception as e:
        logger.error(f"⏰ Weather refresh job FAILED: {e}")
        _job_stats["weather_refresh"]["errors"] += 1
        _job_stats["weather_refresh"]["status"] = "error"


async def _job_cleanup_incidents():
    """Scheduled job: remove expired news incidents from DB."""
    logger.info("⏰ Scheduler: Cleaning up expired incidents...")
    _job_stats["cleanup"]["last_run"] = datetime.utcnow().isoformat()

    try:
        from services.news_fetcher import cleanup_expired_incidents
        await cleanup_expired_incidents()
        _job_stats["cleanup"]["run_count"] += 1
        _job_stats["cleanup"]["status"] = "ok"
    except Exception as e:
        logger.error(f"⏰ Cleanup job FAILED: {e}")
        _job_stats["cleanup"]["errors"] += 1
        _job_stats["cleanup"]["status"] = "error"


# ── Scheduler Lifecycle ──────────────────────────────────────────────────────

def start_scheduler():
    """
    Create and start the APScheduler instance.
    Adds all jobs with configured intervals.
    """
    global _scheduler

    if _scheduler and _scheduler.running:
        logger.warning("Scheduler already running, skipping start")
        return

    _scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    # Job 1: News fetch every NEWS_FETCH_INTERVAL_MINUTES
    _scheduler.add_job(
        _job_fetch_news,
        trigger=IntervalTrigger(minutes=settings.NEWS_FETCH_INTERVAL_MINUTES),
        id="news_fetch",
        name="Crime News Ingestion",
        replace_existing=True,
        max_instances=1,  # Don't stack
    )

    # Job 2: Weather refresh every 30 minutes
    _scheduler.add_job(
        _job_refresh_weather,
        trigger=IntervalTrigger(minutes=settings.WEATHER_REFRESH_INTERVAL_MINUTES),
        id="weather_refresh",
        name="NCR Weather Refresh",
        replace_existing=True,
        max_instances=1,
    )

    # Job 3: Cleanup expired incidents every 24 hours
    _scheduler.add_job(
        _job_cleanup_incidents,
        trigger=IntervalTrigger(hours=24),
        id="cleanup",
        name="Expired Incidents Cleanup",
        replace_existing=True,
        max_instances=1,
    )

    def _on_job_event(event):
        if event.exception:
            logger.error(f"Scheduler job {event.job_id} raised: {event.exception}")

    _scheduler.add_listener(_on_job_event, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    _scheduler.start()

    logger.info(
        f"✅ Scheduler started — news every {settings.NEWS_FETCH_INTERVAL_MINUTES}min, "
        f"weather every {settings.WEATHER_REFRESH_INTERVAL_MINUTES}min"
    )


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")


def get_job_stats() -> Dict[str, Any]:
    """Return current job stats for the /data-sources/status endpoint."""
    return _job_stats


async def trigger_news_fetch_now() -> Dict[str, Any]:
    """Manually trigger a news fetch (for demo / testing)."""
    logger.info("🔄 Manual news fetch triggered")
    await _job_fetch_news()
    return _job_stats["news_fetch"]


async def trigger_weather_refresh_now() -> Dict[str, Any]:
    """Manually trigger a weather refresh."""
    logger.info("🔄 Manual weather refresh triggered")
    await _job_refresh_weather()
    return _job_stats["weather_refresh"]
