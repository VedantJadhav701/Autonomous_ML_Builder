from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.pipeline import Pipeline
from lightgbm import LGBMClassifier, LGBMRegressor
from typing import Tuple, Any, Dict
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class ModelSelectionEngine:
    """Dynamically selects the optimal model and its base parameters based on data sparsity, size and task."""

    @staticmethod
    def get_model_candidate(n_samples: int, n_features: int, is_sparse: bool, is_regression: bool = False) -> Any:
        """Selects a base model candidate for the dataset traits."""
        if is_regression:
            if n_samples < 10000:
                logger.info("Selecting RandomForestRegressor for regression.")
                return RandomForestRegressor(n_jobs=-1, random_state=42)
            else:
                logger.info("Selecting LGBMRegressor for large-scale regression.")
                return LGBMRegressor(n_jobs=-1, random_state=42, verbose=-1)
        else:
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
        if isinstance(model, (RandomForestClassifier, RandomForestRegressor)):
            return {'model__n_estimators': [50, 100]}
        if isinstance(model, (LGBMClassifier, LGBMRegressor)):
            return {'model__learning_rate': [0.05, 0.1]}
        if isinstance(model, Ridge):
            return {'model__alpha': [0.1, 1.0, 10.0]}
        return {}

