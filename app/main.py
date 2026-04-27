from fastapi import FastAPI, HTTPException
import pandas as pd
from app.schemas import PredictionRequest, PredictionResponse, ExplainResponse
from src.tracker import ModelArtifactTracker
from src.monitoring.logger import get_logger
from src.monitoring.drift_detector import DriftDetector

logger = get_logger(__name__)

app = FastAPI(title="Autonomous ML Builder API", version="1.0.0")

# Pre-load pipeline and explainer at startup
try:
    PIPELINE, EXPLAINER = ModelArtifactTracker.load_artifacts()
    logger.info("Pipeline and Explainer loaded successfully for inference.")
except Exception as e:
    logger.error(f"Failed to load artifacts: {e}")
    PIPELINE = None
    EXPLAINER = None


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Model pipeline is not loaded or missing.")
        
    try:
        # Pydantic has validated structure; now parse dynamically allowed fields
        input_data = [item.model_dump() for item in request.data]
        df = pd.DataFrame(input_data)
        
        # Intercept for Drift Detection
        DriftDetector.check_drift(df)
        
        # Sub-10ms Inference
        preds = PIPELINE.predict(df)
        
        return PredictionResponse(predictions=preds.tolist())
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/explain", response_model=ExplainResponse)
async def explain(request: PredictionRequest):
    if PIPELINE is None or EXPLAINER is None:
        raise HTTPException(status_code=503, detail="Pipeline or Explainer is missing. Train the model and ensure explainability is active.")
        
    try:
        input_data = [item.model_dump() for item in request.data]
        df = pd.DataFrame(input_data)
        
        preprocessor = PIPELINE.named_steps.get('preprocessor')
        X_transformed = preprocessor.transform(df)
        # Convert to dense if sparse to run explainability
        if hasattr(X_transformed, "toarray"):
            X_transformed = X_transformed.toarray()
            
        shap_values = EXPLAINER(X_transformed).values
        
        # Extract features for structured JSON response
        feature_names = preprocessor.get_feature_names_out()
        explanations = []
        for i in range(len(shap_values)):
            row_shap = shap_values[i]
            # Map contribution to feature
            contribs = {feature_names[j]: float(row_shap[j]) for j in range(len(feature_names))}
            explanations.append(contribs)
            
        return ExplainResponse(explainability=explanations)
    except Exception as e:
        logger.error(f"Explain error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "pipeline_loaded": PIPELINE is not None, "explainer_loaded": EXPLAINER is not None}
