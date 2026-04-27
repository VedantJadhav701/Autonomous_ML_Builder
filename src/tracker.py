import joblib
import os
import json
import time
from typing import Any, Dict, Optional
from sklearn.pipeline import Pipeline
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class ModelArtifactTracker:
    """Manages serialization of the unified ML pipeline, SHAP explainer, and feature metadata."""

    ARTIFACT_DIR = "models"
    RUNS_DIR = "models/runs"
    PIPELINE_FILE = "unified_pipeline.joblib"
    EXPLAINER_FILE = "shap_explainer.joblib"
    METADATA_FILE = "model_metadata.json"

    @classmethod
    def initialize(cls):
        os.makedirs(cls.ARTIFACT_DIR, exist_ok=True)
        os.makedirs(cls.RUNS_DIR, exist_ok=True)

    @classmethod
    def save_pipeline(cls, pipeline: Pipeline, explainer: Any = None, metadata: Optional[Dict] = None) -> str:
        """
        Saves the pipeline, optional SHAP explainer, and optional feature metadata.
        metadata format: {
            "features": { col: {"type": "number"|"text", "values": [...] or null} },
            "task_type": "classification" | "regression",
            "target_col": str,
            "model_name": str,
        }
        """
        cls.initialize()
        file_path = os.path.join(cls.ARTIFACT_DIR, cls.PIPELINE_FILE)
        expl_path = os.path.join(cls.ARTIFACT_DIR, cls.EXPLAINER_FILE)
        meta_path = os.path.join(cls.ARTIFACT_DIR, cls.METADATA_FILE)

        try:
            joblib.dump(pipeline, file_path)
            if explainer is not None:
                joblib.dump(explainer, expl_path)
                logger.info(f"SHAP Explainer serialized at {expl_path}.")

            if metadata is not None:
                with open(meta_path, "w") as f:
                    json.dump(metadata, f, indent=2)
                logger.info(f"Feature metadata saved at {meta_path}.")

            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            logger.info(f"Unified Pipeline serialized at {file_path}. Size: {size_mb:.2f} MB")
            return file_path
        except Exception as e:
            logger.error(f"Failed to serialize pipeline or explainer: {str(e)}")
            raise e

    @classmethod
    def load_artifacts(cls):
        """Loads the unified pipeline and optional SHAP explainer for inference."""
        file_path = os.path.join(cls.ARTIFACT_DIR, cls.PIPELINE_FILE)
        expl_path = os.path.join(cls.ARTIFACT_DIR, cls.EXPLAINER_FILE)

        if not os.path.exists(file_path):
            raise FileNotFoundError("Missing unified pipeline. Train a model first.")

        logger.info(f"Loading unified pipeline from {file_path}")
        pipeline = joblib.load(file_path)

        explainer = None
        if os.path.exists(expl_path):
            logger.info(f"Loading SHAP explainer from {expl_path}")
            explainer = joblib.load(expl_path)

        return pipeline, explainer

    @classmethod
    def load_metadata(cls) -> Optional[Dict]:
        """Loads the saved feature metadata, or returns None if not present."""
        meta_path = os.path.join(cls.ARTIFACT_DIR, cls.METADATA_FILE)
        if not os.path.exists(meta_path):
            return None
        with open(meta_path, "r") as f:
            return json.load(f)

    @classmethod
    def log_experiment(cls, metrics: dict, optuna_params: dict, llm_overrides: dict) -> str:
        cls.initialize()
        run_id = f"run_{int(time.time())}"
        run_file = os.path.join(cls.RUNS_DIR, f"{run_id}.json")
        snapshot = {
            "run_id": run_id,
            "metrics": metrics,
            "best_hyperparameters": optuna_params,
            "llm_overrides": llm_overrides,
        }
        with open(run_file, "w") as f:
            json.dump(snapshot, f, indent=4)
        logger.info(f"Experiment versioned at {run_file}")
        return run_id
