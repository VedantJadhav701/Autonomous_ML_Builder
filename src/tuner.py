import optuna
from typing import Dict, Any, Tuple
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold, TimeSeriesSplit
from src.config import SystemConfig
from src.monitoring.logger import get_logger

logger = get_logger(__name__)
# Suppress Optuna spam
optuna.logging.set_verbosity(optuna.logging.WARNING)

class HyperparameterTuner:
    """Resource-aware Hyperparameter tuner using Optuna to adhere to time/memory constraints."""

    @staticmethod
    def tune(
        pipeline: Pipeline,
        param_grid: Dict[str, list],
        X: pd.DataFrame,
        y: pd.Series,
        llm_overrides: Dict[str, Any] = None,
        is_regression: bool = False,
    ) -> Pipeline:
        """
        Runs bounded Optuna optimization to find the best hyperparameters.
        Accepts Structural LLM Overrides (e.g. changing validation strategy).
        Returns the completely refitted pipeline with best parameters.
        """
        llm_overrides = llm_overrides or {}
        logger.info(f"Starting Optuna tuning bounded by {SystemConfig.OPTUNA_N_TRIALS} trials or {SystemConfig.OPTUNA_TIMEOUT_SEC}s timeout.")

        # If no grid provided, get default for the model
        if not param_grid:
            from src.models import ModelSelectionEngine
            model = pipeline.named_steps['model']
            param_grid = ModelSelectionEngine.get_param_grid(model)

        def objective(trial: optuna.Trial) -> float:
            trial_params = {}
            for param_name, param_values in param_grid.items():
                trial_params[param_name] = trial.suggest_categorical(param_name, param_values)

            pipeline.set_params(**trial_params)

            validation_strat = llm_overrides.get("validation_strategy", "auto")
            if validation_strat == "time_series":
                cv = TimeSeriesSplit(n_splits=3)
            elif is_regression:
                cv = KFold(n_splits=3, shuffle=True, random_state=42)
            else:
                cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

            scoring = "r2" if is_regression else "f1_weighted"

            try:
                scores = cross_val_score(pipeline, X, y, cv=cv, scoring=scoring, n_jobs=-1)
                return scores.mean()
            except Exception:
                return -999.0 if is_regression else 0.0

        study = optuna.create_study(direction="maximize")
        study.optimize(
            objective,
            n_trials=SystemConfig.OPTUNA_N_TRIALS,
            timeout=SystemConfig.OPTUNA_TIMEOUT_SEC
        )

        logger.info(f"Optimal Score from Tuning: {study.best_value:.4f}")

        # Refit pipeline on full data with best params
        pipeline.set_params(**study.best_params)
        pipeline.fit(X, y)

        return pipeline

