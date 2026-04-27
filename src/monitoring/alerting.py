import os
import requests
import time
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class AlertManager:
    """Manages system alerts via logs and optional webhooks for critical anomalies."""
    
    WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL")
    _last_alerts = {} # Title -> timestamp cache for rate limiting
    ALERT_WINDOW_SEC = 60 # Cooldown period

    @classmethod
    def send_alert(cls, title: str, message: str, level: str = "WARNING") -> None:
        """Dispatches an alert with built-in spam suppression."""
        now = time.time()
        if title in cls._last_alerts:
            if now - cls._last_alerts[title] < cls.ALERT_WINDOW_SEC:
                logger.debug(f"Suppressing redundant alert '{title}' within {cls.ALERT_WINDOW_SEC}s window.")
                return
        
        cls._last_alerts[title] = now
        full_msg = f"[{level}] {title}: {message}"
        
        # 1. Log the alert
        if level == "CRITICAL":
            logger.critical(full_msg)
        else:
            logger.warning(full_msg)
            
        # 2. Fire webhook if configured
        if cls.WEBHOOK_URL:
            try:
                payload = {
                    "text": full_msg,
                    "title": title,
                    "level": level,
                    "system": "Autonomous_ML_Builder",
                    "timestamp": now
                }
                requests.post(cls.WEBHOOK_URL, json=payload, timeout=5)
                logger.info(f"Alert sent to webhook: {cls.WEBHOOK_URL}")
            except Exception as e:
                logger.error(f"Failed to send webhook alert: {e}")
        else:
            logger.debug("No webhook URL configured. Alert restricted to local logs.")
