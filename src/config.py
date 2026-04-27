"""
Configuration module for constraints and thresholds.
Ensures the system adheres to memory, size, and computational limits.
"""

from typing import Dict, Any

class SystemConfig:
    # Rigid Constraints
    MAX_ROWS: int = 50000
    MAX_FILE_SIZE_MB: int = 5
    MAX_MEMORY_GB: int = 1
    TRAINING_TIMEOUT_SEC: int = 300  # 5 minutes
    
    # Feature Engineering Hyperparameters
    HIGH_CARDINALITY_THRESHOLD: int = 10
    MAX_CARDINALITY_LIMIT: int = 1000
    
    # Optuna settings
    OPTUNA_N_TRIALS: int = 10
    OPTUNA_TIMEOUT_SEC: int = 60
    
    # Internal states
    FLOAT_TYPE = "float32"
    INT_TYPE = "int32"
    
    # LLM Guardrails
    ALLOWED_VALIDATION_STRATEGIES = ["stratified", "time_series", "kfold"]
    
    @classmethod
    def get_dict(cls) -> Dict[str, Any]:
        return {k: v for k, v in cls.__dict__.items() if not k.startswith("__")}
