import logging
import sys
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Structured JSON logger for production use."""
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def get_logger(name: str) -> logging.Logger:
    """Returns a structured logger instance."""
    logger = logging.getLogger(name)
    
    # Only add handler if not already present
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        
    return logger
