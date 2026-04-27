from fastapi import FastAPI, HTTPException
import pandas as pd
from app.schemas import PredictionRequest, PredictionResponse
from src.tracker import ModelArtifactTracker
from src.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(title="Autonomous ML Builder API", version="1.0.0")

# Pre-load pipeline at startup to ensure Sub-10ms latency at inference
try:
    PIPELINE = ModelArtifactTracker.load_pipeline()
    logger.info("Pipeline loaded successfully for inference.")
except Exception as e:
    logger.error(f"Failed to load pipeline: {e}")
    PIPELINE = None


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Model pipeline is not loaded or missing.")
        
    try:
        # Pydantic has validated structure; now parse dynamically allowed fields
        input_data = [item.model_dump() for item in request.data]
        df = pd.DataFrame(input_data)
        
        # Sub-10ms Inference
        preds = PIPELINE.predict(df)
        
        return PredictionResponse(predictions=preds.tolist())
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "pipeline_loaded": PIPELINE is not None}
