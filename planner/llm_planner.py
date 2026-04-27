import json
from src.config import SystemConfig
from src.logger import get_logger

logger = get_logger(__name__)

class LLMPipelinePlanner:
    """
    Acts as an orchestration agent that bridges the ML pipeline and an LLM.
    Generates intelligent prompts encapsulating current system constraints to request
    adaptive tuning algorithms, space configurations, or architectural shifts.
    """
    
    @staticmethod
    def generate_tuning_prompt(dataset_shape: tuple) -> str:
        """
        Constructs a prompt context informing an LLM agent of current system constraints
        so it can dynamically propose Optuna parameter grids.
        """
        constraints = SystemConfig.get_dict()
        prompt = f"""
        You are an Autonomous Pipeline Planner agent. 
        The current dataset shape is {dataset_shape}.
        The strict system constraints are:
        {json.dumps(constraints, indent=2)}
        
        Given these constraints, suggest an optimal hyperparameter grid for a LightGBM
        model that guarantees training finishes in under {constraints.get('TRAINING_TIMEOUT_SEC', 300)} seconds.
        Return ONLY valid Python dictionary code.
        """
        logger.info("Generated LLM contextual prompt for autonomous tuning.")
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
