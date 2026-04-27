import joblib
import os
from sklearn.pipeline import Pipeline
from src.logger import get_logger

logger = get_logger(__name__)

class ModelArtifactTracker:
    """Manages serialization of the unified ML pipeline for production."""
    
    ARTIFACT_DIR = "models"
    PIPELINE_FILE = "unified_pipeline.joblib"

    @classmethod
    def initialize(cls):
        if not os.path.exists(cls.ARTIFACT_DIR):
            os.makedirs(cls.ARTIFACT_DIR)

    @classmethod
    def save_pipeline(cls, pipeline: Pipeline) -> str:
        """
        Saves the complete preprocessing + model pipeline as a single artifact.
        This guarantees reproducibility in inference without needing separate state loads.
        """
        cls.initialize()
        file_path = os.path.join(cls.ARTIFACT_DIR, cls.PIPELINE_FILE)
        
        try:
            joblib.dump(pipeline, file_path)
            # Size check
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            logger.info(f"Unified Pipeline serialized at {file_path}. Size: {size_mb:.2f} MB")
            return file_path
        except Exception as e:
            logger.error(f"Failed to serialize pipeline: {str(e)}")
            raise e

    @classmethod
    def load_pipeline(cls) -> Pipeline:
        """Loads the unified pipeline for inference."""
        file_path = os.path.join(cls.ARTIFACT_DIR, cls.PIPELINE_FILE)
        if not os.path.exists(file_path):
            logger.error(f"Pipeline artifact not found at {file_path}")
            raise FileNotFoundError(f"Missing unified pipeline. Train the model first.")
            
        logger.info(f"Loading unified pipeline from {file_path}")
        return joblib.load(file_path)
