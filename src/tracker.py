import joblib
import os
import json
import time
from typing import Any
from sklearn.pipeline import Pipeline
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class ModelArtifactTracker:
    """Manages serialization of the unified ML pipeline and SHAP explainer for production."""
    
    ARTIFACT_DIR = "models"
    RUNS_DIR = "models/runs"
    PIPELINE_FILE = "unified_pipeline.joblib"
    EXPLAINER_FILE = "shap_explainer.joblib"

    @classmethod
    def initialize(cls):
        if not os.path.exists(cls.ARTIFACT_DIR):
            os.makedirs(cls.ARTIFACT_DIR)
        if not os.path.exists(cls.RUNS_DIR):
            os.makedirs(cls.RUNS_DIR)

    @classmethod
    def save_pipeline(cls, pipeline: Pipeline, explainer: Any = None) -> str:
        """
        Saves the complete preprocessing + model pipeline as a single artifact.
        Optionally saves the SHAP explainer for operationalized explainability.
        """
        cls.initialize()
        file_path = os.path.join(cls.ARTIFACT_DIR, cls.PIPELINE_FILE)
        expl_path = os.path.join(cls.ARTIFACT_DIR, cls.EXPLAINER_FILE)
        
        try:
            joblib.dump(pipeline, file_path)
            if explainer:
                joblib.dump(explainer, expl_path)
                logger.info(f"SHAP Explainer serialized at {expl_path}.")
                
            # Size check
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            logger.info(f"Unified Pipeline serialized at {file_path}. Size: {size_mb:.2f} MB")
            return file_path
        except Exception as e:
            logger.error(f"Failed to serialize pipeline or explainer: {str(e)}")
            raise e

    @classmethod
    def load_artifacts(cls) -> tuple[Pipeline, Any]:
        """Loads the unified pipeline and optional SHAP explainer for inference."""
        file_path = os.path.join(cls.ARTIFACT_DIR, cls.PIPELINE_FILE)
        expl_path = os.path.join(cls.ARTIFACT_DIR, cls.EXPLAINER_FILE)
        
        if not os.path.exists(file_path):
            logger.error(f"Pipeline artifact not found at {file_path}")
            raise FileNotFoundError(f"Missing unified pipeline. Train the model first.")
            
        logger.info(f"Loading unified pipeline from {file_path}")
        pipeline = joblib.load(file_path)
        
        explainer = None
        if os.path.exists(expl_path):
            logger.info(f"Loading SHAP explainer from {expl_path}")
            explainer = joblib.load(expl_path)
            
        return pipeline, explainer

    @classmethod
    def log_experiment(cls, metrics: dict, optuna_params: dict, llm_overrides: dict) -> str:
        """Saves a JSON snapshot of the full run configuration."""
        cls.initialize()
        run_id = f"run_{int(time.time())}"
        run_file = os.path.join(cls.RUNS_DIR, f"{run_id}.json")
        
        snapshot = {
            "run_id": run_id,
            "metrics": metrics,
            "best_hyperparameters": optuna_params,
            "llm_overrides": llm_overrides
        }
        with open(run_file, "w") as f:
            json.dump(snapshot, f, indent=4)
        
        logger.info(f"Experiment securely versioned at {run_file}")
        return run_id
