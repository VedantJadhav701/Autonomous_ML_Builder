import optuna
from typing import Dict, Any, Tuple
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold, TimeSeriesSplit
from src.config import SystemConfig
from src.monitoring.logger import get_logger

logger = get_logger(__name__)
# Suppress Optuna spam
optuna.logging.set_verbosity(optuna.logging.WARNING)

class PipelineTuner:
    """Resource-aware Hyperparameter tuner using Optuna to adhere to time/memory constraints."""

    @staticmethod
    def optimize(
        pipeline: Pipeline, 
        param_grid: Dict[str, list], 
        X: pd.DataFrame, 
        y: pd.Series,
        llm_overrides: Dict[str, Any] = None
    ) -> Pipeline:
        """
        Runs bounded Optuna optimization to find the best hyperparameters.
        Accepts Structural LLM Overrides (e.g. changing validation strategy).
        Returns the completely refitted pipeline with best parameters.
        """
        llm_overrides = llm_overrides or {}
        logger.info(f"Starting Optuna tuning bounded by {SystemConfig.OPTUNA_N_TRIALS} trials or {SystemConfig.OPTUNA_TIMEOUT_SEC}s timeout.")
        
        if llm_overrides:
            logger.warning(f"Executing LLM Structural Overrides: {llm_overrides}")
            # Dynamic grid replacement if LLM proposes a better boundary bounds
            if "hyperparameters" in llm_overrides:
                param_grid = llm_overrides["hyperparameters"]

        def objective(trial: optuna.Trial) -> float:
            # Dynamically suggest hyperparameters from the grid
            trial_params = {}
            for param_name, param_values in param_grid.items():
                if isinstance(param_values[0], int):
                    trial_params[param_name] = trial.suggest_categorical(param_name, param_values)
                elif isinstance(param_values[0], float):
                    trial_params[param_name] = trial.suggest_categorical(param_name, param_values)
                elif isinstance(param_values[0], str) or param_values[0] is None:
                    trial_params[param_name] = trial.suggest_categorical(param_name, param_values)
            
            # Set params
            pipeline.set_params(**trial_params)
            
            # Structurally override CV if LLM detected temporal constraints
            validation_strat = llm_overrides.get("validation_strategy", "stratified")
            if validation_strat == "time_series":
                logger.info("Enforcing TimeSeriesSplit Validation Strategy driven by LLM Override.")
                cv = TimeSeriesSplit(n_splits=3)
            else:
                cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
                
            scores = cross_val_score(pipeline, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
            
            return scores.mean()

        study = optuna.create_study(direction="maximize")
        study.optimize(
            objective, 
            n_trials=SystemConfig.OPTUNA_N_TRIALS, 
            timeout=SystemConfig.OPTUNA_TIMEOUT_SEC
        )
        
        logger.info(f"Optimal ROC-AUC Score from Tuning: {study.best_value:.4f}")
        logger.info(f"Best Parameters: {study.best_params}")
        
        # Refit pipeline on full data with best params
        best_pipeline = pipeline.set_params(**study.best_params)
        best_pipeline.fit(X, y)
        
        return best_pipeline
