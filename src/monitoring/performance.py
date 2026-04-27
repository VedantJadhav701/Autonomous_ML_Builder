import os
import json
import numpy as np
import time
from typing import List, Any
from sklearn.metrics import accuracy_score, f1_score
from src.monitoring.logger import get_logger
from src.monitoring.alerting import AlertManager
from src.monitoring.drift_detector import DriftDetector
from typing import List, Any

logger = get_logger(__name__)

class PerformanceTracker:
    """Tracks continuous model performance degradation via feedback loops."""
    
    FEEDBACK_FILE = "models/performance_log.json"
    STAGING_FILE = "models/prediction_staging.json"
    ANALYSIS_LOG = "models/analysis_log.json"
    
    @classmethod
    def stage_predictions(cls, request_ids: List[str], predictions: List[Any]) -> None:
        """Stores predictions in a staging area to await ground truth feedback."""
        os.makedirs("models", exist_ok=True)
        staging = {}
        if os.path.exists(cls.STAGING_FILE):
            with open(cls.STAGING_FILE, "r") as f:
                staging = json.load(f)
        
        for rid, pred in zip(request_ids, predictions):
            staging[rid] = pred
            
        # Limit staging size to 10k to prevent OOM
        if len(staging) > 10000:
            keys = list(staging.keys())
            for key in keys[:-10000]:
                staging.pop(key)
                
        with open(cls.STAGING_FILE, "w") as f:
            json.dump(staging, f)

    @classmethod
    def log_feedback(cls, request_ids: List[str], truths: List[Any]) -> None:
        """Resolves staged predictions with truth feedback for performance metrics."""
        os.makedirs("models", exist_ok=True)
        
        # Load staging
        staging = {}
        if os.path.exists(cls.STAGING_FILE):
            with open(cls.STAGING_FILE, "r") as f:
                staging = json.load(f)
        
        history = {"truths": [], "preds": []}
        if os.path.exists(cls.FEEDBACK_FILE):
            with open(cls.FEEDBACK_FILE, "r") as f:
                history = json.load(f)

        resolved_count = 0
        for rid, truth in zip(request_ids, truths):
            if rid in staging:
                history["truths"].append(truth)
                history["preds"].append(staging.pop(rid))
                resolved_count += 1
        
        if resolved_count == 0:
            logger.warning("Feedback received but no matching request_ids found in staging!")
            return

        # Enforce history limit
        history["truths"] = history["truths"][-10000:]
        history["preds"] = history["preds"][-10000:]

        with open(cls.FEEDBACK_FILE, "w") as f:
            json.dump(history, f)
            
        with open(cls.STAGING_FILE, "w") as f:
            json.dump(staging, f)
            
        logger.info(f"Resolved {resolved_count} predictions with feedback.")
        cls._calculate_running_metrics(history)
            
    @classmethod
    def _calculate_running_metrics(cls, history: dict) -> None:
        """Calculates F1/Accuracy over the continuous time window to track degradation."""
        try:
            y_true = np.array(history["truths"])
            y_pred = np.array(history["preds"])
            
            if len(y_true) < 10: # Avoid noise on small samples
                return

            acc = accuracy_score(y_true, y_pred)
            f1 = f1_score(y_true, y_pred, average='weighted')
            
            logger.info(f"Running Performance Metrics (N={len(y_true)}): Accuracy={acc:.4f}, F1={f1:.4f}")
            
            # Log correlation between drift and performance
            cls._log_correlation(float(acc), float(f1))

            if f1 < 0.5:
                msg = f"Running F1-Score crashed below 0.5 (Current={f1:.4f}). Model retraining strongly advised!"
                AlertManager.send_alert("Model Performance Alert", msg, level="CRITICAL")
        except Exception as e:
            logger.error(f"Failed to calculate running metrics: {e}")

    @classmethod
    def _log_correlation(cls, acc: float, f1: float) -> None:
        """Saves unified snapshot of system intelligence (Drift vs. Performance)."""
        snapshot = {
            "timestamp": time.time(),
            "performance": {"accuracy": acc, "f1": f1},
            "drift_p_values": DriftDetector.latest_p_values
        }
        
        history = []
        if os.path.exists(cls.ANALYSIS_LOG):
            with open(cls.ANALYSIS_LOG, "r") as f:
                history = json.load(f)
        
        history.append(snapshot)
        history = history[-100:] # Keep last 100 snapshots
        
        with open(cls.ANALYSIS_LOG, "w") as f:
            json.dump(history, f, indent=4)
        
        logger.info(f"Drift-Performance correlation snapshot saved to {cls.ANALYSIS_LOG}")
