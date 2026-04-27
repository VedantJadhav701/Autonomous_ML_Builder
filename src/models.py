from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from lightgbm import LGBMClassifier
from typing import Tuple, Any, Dict
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class ModelSelectionEngine:
    """Dynamically selects the optimal model and its base parameters based on data sparsity and size."""

    @staticmethod
    def get_model_candidate(n_samples: int, n_features: int, is_sparse: bool) -> Any:
        """Selects a base model candidate for the dataset traits."""
        if is_sparse and n_samples < 5000:
            logger.info("Selecting Logistic Regression for sparse data.")
            return LogisticRegression(solver='liblinear', max_iter=1000)
        elif n_samples < 10000:
            logger.info("Selecting Random Forest for robust small-scale learning.")
            return RandomForestClassifier(n_jobs=-1, random_state=42)
        else:
            logger.info("Selecting LightGBM for performant large-scale learning.")
            return LGBMClassifier(n_jobs=-1, random_state=42, verbose=-1)

    @staticmethod
    def create_unified_pipeline(preprocessor: Any, model: Any) -> Pipeline:
        """Wraps preprocessor and model into a single versioned pipeline."""
        return Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])

    @staticmethod
    def get_param_grid(model: Any) -> Dict[str, Any]:
        """Returns search space for the selected model."""
        if isinstance(model, LogisticRegression):
            return {'model__C': [0.1, 1.0, 10.0]}
        if isinstance(model, RandomForestClassifier):
            return {'model__n_estimators': [50, 100]}
        if isinstance(model, LGBMClassifier):
            return {'model__learning_rate': [0.05, 0.1]}
        return {}
