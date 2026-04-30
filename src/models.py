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
    def get_model_candidate(n_samples: int, n_features: int, is_sparse: bool, is_regression: bool = False, aggressive: bool = False) -> Any:
        """Selects a base model candidate for the dataset traits."""
        from sklearn.ensemble import StackingClassifier, StackingRegressor
        from sklearn.linear_model import LogisticRegression, Ridge
        
        # Aggressive Mode: Use XGBoost and CatBoost in the stack
        if aggressive:
            from xgboost import XGBClassifier, XGBRegressor
            from catboost import CatBoostClassifier, CatBoostRegressor
            
            if is_regression:
                logger.info("🔥 AGGRESSIVE MODE: Building Elite Regression Stack (RF + LGBM + XGB + CatBoost)")
                estimators = [
                    ('rf', RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42)),
                    ('lgbm', LGBMRegressor(n_estimators=100, n_jobs=-1, random_state=42, verbose=-1)),
                    ('xgb', XGBRegressor(n_estimators=100, n_jobs=-1, random_state=42, verbosity=0)),
                    ('cat', CatBoostRegressor(n_estimators=100, random_state=42, verbose=0))
                ]
                return StackingRegressor(
                    estimators=estimators,
                    final_estimator=Ridge(),
                    cv=3,
                    n_jobs=-1
                )
            else:
                logger.info("🔥 AGGRESSIVE MODE: Building Elite Classification Stack (RF + LGBM + XGB + CatBoost)")
                estimators = [
                    ('rf', RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42, class_weight='balanced')),
                    ('lgbm', LGBMClassifier(n_estimators=100, n_jobs=-1, random_state=42, verbose=-1, class_weight='balanced')),
                    ('xgb', XGBClassifier(n_estimators=100, n_jobs=-1, random_state=42, verbosity=0)),
                    ('cat', CatBoostClassifier(n_estimators=100, random_state=42, verbose=0))
                ]
                return StackingClassifier(
                    estimators=estimators,
                    final_estimator=LogisticRegression(),
                    cv=3,
                    n_jobs=-1
                )

        if is_regression:
            if n_samples < 1000:
                logger.info("Selecting RandomForestRegressor for small regression.")
                return RandomForestRegressor(n_jobs=-1, random_state=42)
            else:
                logger.info("Selecting StackingRegressor (RF + LGBM + Ridge) for peak accuracy.")
                estimators = [
                    ('rf', RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42)),
                    ('lgbm', LGBMRegressor(n_estimators=100, n_jobs=-1, random_state=42, verbose=-1)),
                    ('ridge', Ridge(alpha=1.0))
                ]
                return StackingRegressor(
                    estimators=estimators,
                    final_estimator=Ridge(),
                    cv=3,
                    n_jobs=-1
                )
        else:
            if is_sparse and n_samples < 5000:
                logger.info("Selecting Logistic Regression for sparse data.")
                return LogisticRegression(solver='liblinear', max_iter=1000, class_weight='balanced')
            elif n_samples < 1000:
                logger.info("Selecting Random Forest for robust small-scale learning.")
                return RandomForestClassifier(n_jobs=-1, random_state=42, class_weight='balanced')
            else:
                logger.info("Selecting StackingClassifier (RF + LGBM + LogReg) for peak accuracy.")
                estimators = [
                    ('rf', RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42, class_weight='balanced')),
                    ('lgbm', LGBMClassifier(n_estimators=100, n_jobs=-1, random_state=42, verbose=-1, class_weight='balanced')),
                    ('lr', LogisticRegression(max_iter=1000, class_weight='balanced'))
                ]
                return StackingClassifier(
                    estimators=estimators,
                    final_estimator=LogisticRegression(),
                    cv=3,
                    n_jobs=-1
                )

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
        from sklearn.ensemble import VotingClassifier, VotingRegressor, StackingClassifier, StackingRegressor
        
        if isinstance(model, (VotingClassifier, VotingRegressor, StackingClassifier, StackingRegressor)):
            return {
                'model__rf__n_estimators': [50, 100],
                'model__lgbm__learning_rate': [0.05, 0.1],
                'model__xgb__max_depth': [3, 6],
                'model__cat__depth': [4, 6]
            }
        
        if isinstance(model, LogisticRegression):
            return {'model__C': [0.1, 1.0, 10.0]}
        if isinstance(model, (RandomForestClassifier, RandomForestRegressor)):
            return {'model__n_estimators': [50, 100]}
        if isinstance(model, (LGBMClassifier, LGBMRegressor)):
            return {'model__learning_rate': [0.05, 0.1]}
        if isinstance(model, Ridge):
            return {'model__alpha': [0.1, 1.0, 10.0]}
        return {}

