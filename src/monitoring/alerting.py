import json
import os
import requests
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class AlertManager:
    """Manages system alerts via logs and optional webhooks for critical anomalies."""
    
    WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL") # To be set in production env
    
    @classmethod
    def send_alert(cls, title: str, message: str, level: str = "WARNING") -> None:
        """Dispatches an alert to loggers and optional external webhooks."""
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
                    "system": "Autonomous_ML_Builder"
                }
                requests.post(cls.WEBHOOK_URL, json=payload, timeout=5)
                logger.info(f"Alert sent to webhook: {cls.WEBHOOK_URL}")
            except Exception as e:
                logger.error(f"Failed to send webhook alert: {e}")
        else:
            logger.debug("No webhook URL configured. Alert restricted to local logs.")
