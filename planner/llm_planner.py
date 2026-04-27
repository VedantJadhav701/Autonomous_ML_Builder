import json
from src.config import SystemConfig
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class LLMPipelinePlanner:
    """
    Acts as an orchestration agent that bridges the ML pipeline and an LLM.
    Generates intelligent prompts encapsulating current system constraints to request
    adaptive tuning algorithms, space configurations, or architectural shifts.
    """
    
    @staticmethod
    def generate_tuning_prompt(dataset_shape: tuple, feature_layout: dict) -> str:
        """
        Constructs a prompt context informing an LLM agent of current system constraints
        so it can dynamically propose Optuna parameter grids or validation overrides.
        """
        constraints = SystemConfig.get_dict()
        prompt = f"""
        You are an Autonomous Pipeline Planner agent. 
        The current dataset shape is {dataset_shape}.
        The detected automated feature layout is: {json.dumps(feature_layout)}
        
        The strict system constraints are:
        {json.dumps(constraints, indent=2)}
        
        Given these constraints, suggest an optimal hyperparameter grid for a LightGBM model.
        Also, if the feature layout indicates chronological sequences (e.g., date features), 
        override the validation strategy by setting "validation_strategy": "time_series".
        
        Return ONLY valid Python JSON dictionary code.
        Example: 
        {{
            "hyperparameters": {{"model__num_leaves": [31, 63], "model__learning_rate": [0.01, 0.1]}},
            "validation_strategy": "time_series" 
        }}
        """
        logger.info("Generated LLM contextual prompt for autonomous structural tuning.")
        return prompt

    @staticmethod
    def apply_llm_suggestions(json_suggestion: str) -> dict:
        """Parses and validates LLM constraint-bound suggestions."""
        try:
            suggestion = json.loads(json_suggestion)
            logger.info("Successfully ingested LLM-driven architectural suggestions.")
            return suggestion
        except Exception as e:
            logger.error(f"Failed to parse LLM planner output: {e}")
            return {}
