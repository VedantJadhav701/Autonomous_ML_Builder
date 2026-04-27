from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, List, Optional

class PredictionInput(BaseModel):
    """
    Generic feature dictionary to accept varying column schemas 
    for any tabular dataset.
    """
    model_config = ConfigDict(extra='allow')
    
class PredictionRequest(BaseModel):
    data: List[PredictionInput]
    request_ids: Optional[List[str]] = None

class PredictionResponse(BaseModel):
    predictions: List[Any]
    request_ids: List[str]
    message: str = "Success"

class ExplainResponse(BaseModel):
    explainability: List[Dict[str, Any]]
    message: str = "Success"

class FeedbackRequest(BaseModel):
    request_ids: List[str]
    truths: List[Any]
