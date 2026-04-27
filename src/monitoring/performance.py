import os
import json
import numpy as np
from typing import List
from sklearn.metrics import accuracy_score, f1_score
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class PerformanceTracker:
    """Tracks continuous model performance degradation via feedback loops."""
    
    FEEDBACK_FILE = "models/performance_log.json"
    
    @classmethod
    def log_feedback(cls, truths: List[Any], preds: List[Any]) -> None:
        """Stores predictions and ground truth securely for rolling metrics."""
        os.makedirs("models", exist_ok=True)
        
        history = {"truths": [], "preds": []}
        if os.path.exists(cls.FEEDBACK_FILE):
            with open(cls.FEEDBACK_FILE, "r") as f:
                history = json.load(f)
                
        history["truths"].extend(truths)
        history["preds"].extend(preds)
        
        # Enforce memory bounds on log file to prevent bloat (keep last 10,000)
        history["truths"] = history["truths"][-10000:]
        history["preds"] = history["preds"][-10000:]
        
        with open(cls.FEEDBACK_FILE, "w") as f:
            json.dump(history, f)
            
        cls._calculate_running_metrics(history)
            
    @classmethod
    def _calculate_running_metrics(cls, history: dict) -> None:
        """Calculates F1/Accuracy over the continuous time window to track degradation."""
        try:
            # Assuming labels and preds are aligned
            y_true = np.array(history["truths"])
            y_pred = np.array(history["preds"])
            
            # Simple thresholding logic based on types (e.g. classification assumed if strings or ints)
            # A more complex system would separate regression vs classification seamlessly
            acc = accuracy_score(y_true, y_pred)
            f1 = f1_score(y_true, y_pred, average='weighted')
            
            logger.info(f"Running Performance Metrics (N={len(y_true)}): Accuracy={acc:.4f}, F1={f1:.4f}")
            
            # Simulated performance degradation alert
            if f1 < 0.5:
                logger.warning("Performance Alert: Running F1-Score crashed below 0.5. Model retraining strongly advised!")
        except Exception as e:
            logger.error(f"Failed to calculate running metrics: {e}")
