from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from lightgbm import LGBMClassifier
from typing import Tuple, Any, Dict
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class ModelSelector:
    """Dynamically selects the optimal model and its base parameters based on data sparsity and size."""

    @staticmethod
    def get_model(n_samples: int, n_features: int, is_sparse_expected: bool) -> Tuple[Any, Dict[str, Any], bool]:
        """
        Returns an instance of the chosen model and its param grid for tuning.
        Also returns `is_tree_model` flag for preprocessing decisions.
        """
        # Criteria for Logistic Regression: High sparsity (e.g., lots of OHE features) or very small datasets
        if is_sparse_expected and n_samples < 5000:
            logger.info("Selecting Logistic Regression (Optimized for high sparsity on small data).")
            model = LogisticRegression(solver='liblinear', max_iter=1000)
            param_grid = {
                'model__C': [0.1, 1.0, 10.0],
                'model__penalty': ['l1', 'l2']
            }
            return model, param_grid, False

        # Criteria for Random Forest: Small datasets, robust to noise
        elif n_samples < 10000 and n_features < 50:
            logger.info("Selecting Random Forest (Robustness prior over boosting on small dense data).")
            model = RandomForestClassifier(n_jobs=-1, random_state=42)
            param_grid = {
                'model__n_estimators': [50, 100, 200],
                'model__max_depth': [None, 10, 20],
                'model__min_samples_split': [2, 5]
            }
            return model, param_grid, True

        # Criteria for LightGBM: Medium/Large datasets, fast CPU performance
        else:
            logger.info("Selecting LightGBM (Superior performance on medium dataset sizes).")
            model = LGBMClassifier(n_jobs=-1, random_state=42, verbose=-1)
            param_grid = {
                'model__num_leaves': [31, 63, 127],
                'model__learning_rate': [0.01, 0.05, 0.1],
                'model__n_estimators': [100, 200]
            }
            return model, param_grid, True
