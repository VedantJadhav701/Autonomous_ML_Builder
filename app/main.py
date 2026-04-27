from fastapi import FastAPI, HTTPException
import pandas as pd
import uuid
import hashlib
import json as json_lib
from app.schemas import PredictionRequest, PredictionResponse, ExplainResponse, FeedbackRequest
from src.tracker import ModelArtifactTracker
from src.monitoring.logger import get_logger
from src.monitoring.drift_detector import DriftDetector
from src.monitoring.performance import PerformanceTracker

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


EXPLAIN_CACHE = {} # Hash -> Explanations cache
MAX_CACHE_SIZE = 100

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="Model pipeline is not loaded or missing.")
        
    try:
        # Pydantic has validated structure; now parse dynamically allowed fields
        input_data = [item.model_dump() for item in request.data]
        df = pd.DataFrame(input_data)
        
        # Generate or Validate Request IDs for async feedback loop
        n_rows = len(df)
        if request.request_ids:
            if len(request.request_ids) != n_rows:
                raise HTTPException(status_code=400, detail="request_ids length must match data length")
            request_ids = request.request_ids
        else:
            request_ids = [str(uuid.uuid4()) for _ in range(n_rows)]

        # Intercept for Drift Detection
        DriftDetector.check_drift(df)
        
        # Sub-10ms Inference
        preds = PIPELINE.predict(df)
        preds_list = preds.tolist() if hasattr(preds, 'tolist') else list(preds)

        # Stage for future async performance evaluation
        PerformanceTracker.stage_predictions(request_ids, preds_list)
        
        return PredictionResponse(predictions=preds_list, request_ids=request_ids)
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/explain", response_model=ExplainResponse)
async def explain(request: PredictionRequest):
    if PIPELINE is None or EXPLAINER is None:
        raise HTTPException(status_code=503, detail="Pipeline or Explainer is missing. Train the model and ensure explainability is active.")
        
    try:
        input_data = [item.model_dump() for item in request.data]
        # Data hash for caching
        payload_hash = hashlib.md5(json_lib.dumps(input_data, sort_keys=True).encode()).hexdigest()
        if payload_hash in EXPLAIN_CACHE:
            logger.info("Serving SHAP explanation from memory cache.")
            return ExplainResponse(explainability=EXPLAIN_CACHE[payload_hash])

        df = pd.DataFrame(input_data)
        
        # scalability guardrail: hard cap explain payload to max 50 rows to prevent OOM
        if len(df) > 50:
            logger.warning("Explain payload exceeded hard limit (50). Truncating to prevent memory exhaustion.")
            df = df.head(50)
        
        preprocessor = PIPELINE.named_steps.get('preprocessor')
        X_transformed = preprocessor.transform(df)
        # Convert to dense if sparse to run explainability
        if hasattr(X_transformed, "toarray"):
            X_transformed = X_transformed.toarray()
            
        shap_results = EXPLAINER(X_transformed).values
        
        # Extract features for structured JSON response
        feature_names = preprocessor.get_feature_names_out()
        explanations = []
        for i in range(len(shap_results)):
            row_shap = shap_results[i]
            # Map contribution to feature. Handle binary/multiclass multi-dim arrays.
            contribs = {}
            for j in range(len(feature_names)):
                val = row_shap[j]
                # If multidimensional (e.g. binary output [negative, positive]), grab the positive contrib
                if hasattr(val, "__len__") and len(val) > 1:
                    contribs[feature_names[j]] = float(val[-1])
                else:
                    contribs[feature_names[j]] = float(val)
            explanations.append(contribs)
            
        # Update cache
        if len(EXPLAIN_CACHE) >= MAX_CACHE_SIZE:
            EXPLAIN_CACHE.pop(next(iter(EXPLAIN_CACHE)))
        EXPLAIN_CACHE[payload_hash] = explanations
            
        return ExplainResponse(explainability=explanations)
    except Exception as e:
        logger.error(f"Explain error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/feedback")
async def feedback(request: FeedbackRequest):
    """Ingests continuous ground truths and forces performance recalculations."""
    try:
        PerformanceTracker.log_feedback(request.request_ids, request.truths)
        return {"status": "Feedback securely logged and evaluated."}
    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "pipeline_loaded": PIPELINE is not None, "explainer_loaded": EXPLAINER is not None}
