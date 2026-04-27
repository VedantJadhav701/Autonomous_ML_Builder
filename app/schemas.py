from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, List

class PredictionInput(BaseModel):
    """
    Generic feature dictionary to accept varying column schemas 
    for any tabular dataset.
    """
    model_config = ConfigDict(extra='allow')
    
class PredictionRequest(BaseModel):
    data: List[PredictionInput]

class PredictionResponse(BaseModel):
    predictions: List[Any]
    message: str = "Success"
