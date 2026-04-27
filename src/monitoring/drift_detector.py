import pandas as pd
import numpy as np
import json
import os
from typing import Dict, Any
from scipy.stats import ks_2samp
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class DriftDetector:
    """Calculates dataset baselines during training and monitors drift during inference via KS Tests."""
    
    BASELINE_FILE = "models/drift_baselines.json"
    
    @classmethod
    def calculate_baselines(cls, df: pd.DataFrame) -> None:
        """Calculates statistical baselines and saves empirical samples for KS tests."""
        baselines = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                # Downsample to max 1000 points to keep baseline file small (approx 4KB per feature)
                sample_size = min(len(df), 1000)
                samples = df[col].dropna().sample(n=sample_size, random_state=42).tolist()
                baselines[col] = {
                    "type": "numeric",
                    "samples": samples
                }
            else:
                top_categories = df[col].value_counts().head(5).index.tolist()
                baselines[col] = {
                    "type": "categorical",
                    "top_categories": top_categories
                }
                
        os.makedirs("models", exist_ok=True)
        with open(cls.BASELINE_FILE, "w") as f:
            json.dump(baselines, f)
        logger.info(f"Drift baselines (Empirical Samples) explicitly serialized to {cls.BASELINE_FILE}.")

    @classmethod
    def check_drift(cls, input_df: pd.DataFrame) -> None:
        """Compares incoming inference data against serialized baselines using KS-Test."""
        if not os.path.exists(cls.BASELINE_FILE):
            logger.warning("Drift baselines not found. Skipping drift detection.")
            return

        with open(cls.BASELINE_FILE, "r") as f:
            baselines = json.load(f)
            
        for col in input_df.columns:
            if col not in baselines:
                logger.warning(f"Feature '{col}' not in training baseline! Upstream schema shift detected!")
                continue
                
            base_stats = baselines[col]
            if base_stats["type"] == "numeric" and pd.api.types.is_numeric_dtype(input_df[col]):
                incoming_samples = input_df[col].dropna().tolist()
                baseline_samples = base_stats["samples"]
                
                if len(incoming_samples) > 0 and len(baseline_samples) > 0:
                    stat, p_value = ks_2samp(baseline_samples, incoming_samples)
                    # p-value < 0.05 implies distributions are significantly different
                    if p_value < 0.05:
                        logger.warning(f"Drift Alert! Feature '{col}' failed KS-Test (p-value={p_value:.4f}). Distribution shift detected.")
