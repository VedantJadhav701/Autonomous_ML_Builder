from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import uuid, hashlib, json as json_lib, time, threading, io
from typing import Optional
from app.schemas import PredictionRequest, PredictionResponse, ExplainResponse, FeedbackRequest
from src.tracker import ModelArtifactTracker
from src.monitoring.logger import get_logger
from src.monitoring.drift_detector import DriftDetector
from src.monitoring.performance import PerformanceTracker

logger = get_logger(__name__)

app = FastAPI(title="Autonomous ML Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global inference state (hot-swappable) ──────────────────────────────────
try:
    PIPELINE, EXPLAINER = ModelArtifactTracker.load_artifacts()
    logger.info("Pipeline and Explainer loaded successfully for inference.")
except Exception as e:
    logger.error(f"Failed to load artifacts: {e}")
    PIPELINE = None
    EXPLAINER = None

EXPLAIN_CACHE: dict = {}
MAX_CACHE_SIZE = 100

# ── Training job registry ────────────────────────────────────────────────────
JOBS: dict = {}   # job_id -> { stage, step, progress, status, result, error }

STAGE_LABELS = [
    "Profiling Data",
    "Feature Engineering",
    "Selecting Model",
    "Training + Tuning",
    "Evaluating Model",
    "Deploying Model",
]
TOTAL_STEPS = len(STAGE_LABELS)


def _set_stage(job_id: str, step_idx: int):
    """Update job progress (0-indexed step)."""
    JOBS[job_id].update({
        "stage": STAGE_LABELS[step_idx],
        "step": step_idx + 1,
        "progress": int((step_idx / TOTAL_STEPS) * 100),
    })


def _run_training(job_id: str, csv_bytes: bytes, target_col: str, task_type: str):
    """Background training thread — runs the full 6-stage pipeline."""
    global PIPELINE, EXPLAINER

    JOBS[job_id] = {"stage": "Starting", "step": 0, "progress": 0, "status": "running", "result": None, "error": None}
    t_start = time.time()

    try:
        # ── Stage 1: Profile Data ────────────────────────────────────────────
        _set_stage(job_id, 0)
        from src.data_profiler import DataProfiler
        from src.config import SystemConfig

        df = pd.read_csv(io.BytesIO(csv_bytes))
        if len(df) > SystemConfig.MAX_ROWS:
            df = df.head(SystemConfig.MAX_ROWS)
            logger.warning(f"Dataset truncated to {SystemConfig.MAX_ROWS} rows.")

        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in CSV.")

        X, y, feature_layout = DataProfiler.profile_and_prepare(df, target_col)
        n_samples, n_features = X.shape
        logger.info(f"Profiled: {n_samples} rows × {n_features} features")

        # ── Stage 2: Feature Engineering ────────────────────────────────────
        _set_stage(job_id, 1)
        from src.feature_engineering import FeatureEngineeringPipeline
        from src.models import ModelSelectionEngine

        # Quick model candidate to know if tree (affects scaling)
        _model_candidate = ModelSelectionEngine.get_model_candidate(n_samples, n_features, is_sparse=False)
        from lightgbm import LGBMClassifier
        from sklearn.ensemble import RandomForestClassifier
        is_tree = isinstance(_model_candidate, (LGBMClassifier, RandomForestClassifier))

        preprocessor = FeatureEngineeringPipeline.build_preprocessor(feature_layout, is_tree_model=is_tree)

        # ── Stage 3: Select Model ────────────────────────────────────────────
        _set_stage(job_id, 2)
        model = ModelSelectionEngine.get_model_candidate(n_samples, n_features, is_sparse=False)
        model_name = type(model).__name__
        logger.info(f"Selected model: {model_name}")

        unified_pipeline = ModelSelectionEngine.create_unified_pipeline(preprocessor, model)
        param_grid = ModelSelectionEngine.get_param_grid(model)

        # ── Stage 4: Train + Tune ────────────────────────────────────────────
        _set_stage(job_id, 3)
        from src.tuner import HyperparameterTuner
        from sklearn.model_selection import train_test_split

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if task_type != "regression" else None)
        tuned_pipeline = HyperparameterTuner.tune(unified_pipeline, param_grid, X_train, y_train)

        # ── Stage 5: Evaluate ────────────────────────────────────────────────
        _set_stage(job_id, 4)
        from src.evaluation import EvaluationEngine
        metrics = EvaluationEngine.evaluate_model(tuned_pipeline, X_test, y_test)
        explainer = EvaluationEngine.generate_shap_report(tuned_pipeline, X_train, is_tree_model=is_tree)

        # Feature importance (mean |SHAP| across training sample)
        feature_importance: dict = {}
        try:
            preprocessor_fitted = tuned_pipeline.named_steps["preprocessor"]
            feat_names = list(preprocessor_fitted.get_feature_names_out())
            X_tr_transformed = preprocessor_fitted.transform(X_train.head(200))
            if hasattr(X_tr_transformed, "toarray"):
                X_tr_transformed = X_tr_transformed.toarray()

            if explainer is not None:
                shap_vals = explainer.shap_values(X_tr_transformed)
                if isinstance(shap_vals, list):
                    shap_arr = np.abs(shap_vals[-1])
                else:
                    shap_arr = np.abs(shap_vals) if shap_vals.ndim == 2 else np.abs(shap_vals[:, :, -1])
                mean_abs = shap_arr.mean(axis=0)
                feature_importance = {feat_names[i]: float(mean_abs[i]) for i in range(len(feat_names))}
                # Top 12 sorted
                feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:12])
        except Exception as ex:
            logger.warning(f"Feature importance extraction failed: {ex}")

        # ── Stage 6: Deploy ──────────────────────────────────────────────────
        _set_stage(job_id, 5)
        ModelArtifactTracker.save_pipeline(tuned_pipeline, explainer)
        # Hot-swap global inference state
        PIPELINE = tuned_pipeline
        EXPLAINER = explainer
        EXPLAIN_CACHE.clear()
        logger.info("Hot-swap complete: new model is live for inference.")

        elapsed = round(time.time() - t_start, 1)

        JOBS[job_id].update({
            "stage": "Complete",
            "step": TOTAL_STEPS,
            "progress": 100,
            "status": "done",
            "result": {
                "model_name": model_name,
                "metrics": metrics,
                "training_time_sec": elapsed,
                "feature_importance": feature_importance,
                "n_samples": n_samples,
                "n_features": n_features,
            },
        })

    except Exception as e:
        logger.error(f"Training job {job_id} failed: {e}")
        JOBS[job_id].update({"status": "failed", "error": str(e), "progress": -1})


# ── Training endpoints ───────────────────────────────────────────────────────

@app.post("/train")
async def start_training(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_column: str = Form(...),
    task_type: str = Form("auto"),
):
    """Upload a CSV and launch an async training job. Returns a job_id to poll."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    csv_bytes = await file.read()
    if len(csv_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5 MB limit.")

    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"stage": "Queued", "step": 0, "progress": 0, "status": "queued", "result": None, "error": None}

    # Run in a real OS thread (not FastAPI's thread pool) to avoid blocking the event loop
    thread = threading.Thread(target=_run_training, args=(job_id, csv_bytes, target_column, task_type), daemon=True)
    thread.start()

    return {"job_id": job_id}


@app.get("/status/{job_id}")
async def job_status(job_id: str):
    """Poll training progress. Returns stage, step, progress (0-100), status."""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    job = JOBS[job_id]
    return {
        "job_id": job_id,
        "stage": job["stage"],
        "step": job["step"],
        "total_steps": TOTAL_STEPS,
        "progress": job["progress"],
        "status": job["status"],
        "error": job.get("error"),
    }


@app.get("/results/{job_id}")
async def job_results(job_id: str):
    """Retrieve final result once status == done."""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    job = JOBS[job_id]
    if job["status"] != "done":
        raise HTTPException(status_code=400, detail=f"Job is not complete yet (status: {job['status']}).")
    return job["result"]


# ── Inference endpoints (unchanged) ─────────────────────────────────────────

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="No model loaded. Train a model first.")
    try:
        input_data = [item.model_dump() for item in request.data]
        df = pd.DataFrame(input_data)
        n_rows = len(df)
        request_ids = request.request_ids if request.request_ids and len(request.request_ids) == n_rows else [str(uuid.uuid4()) for _ in range(n_rows)]
        DriftDetector.check_drift(df)
        preds = PIPELINE.predict(df)
        preds_list = preds.tolist() if hasattr(preds, "tolist") else list(preds)
        PerformanceTracker.stage_predictions(request_ids, preds_list)
        return PredictionResponse(predictions=preds_list, request_ids=request_ids)
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/explain", response_model=ExplainResponse)
async def explain(request: PredictionRequest):
    if PIPELINE is None or EXPLAINER is None:
        raise HTTPException(status_code=503, detail="Pipeline or Explainer not loaded.")
    try:
        input_data = [item.model_dump() for item in request.data]
        payload_hash = hashlib.md5(json_lib.dumps(input_data, sort_keys=True).encode()).hexdigest()
        if payload_hash in EXPLAIN_CACHE:
            return ExplainResponse(explainability=EXPLAIN_CACHE[payload_hash])
        df = pd.DataFrame(input_data)
        if len(df) > 50:
            df = df.head(50)
        preprocessor = PIPELINE.named_steps.get("preprocessor")
        X_transformed = preprocessor.transform(df)
        if hasattr(X_transformed, "toarray"):
            X_transformed = X_transformed.toarray()
        shap_results = EXPLAINER(X_transformed).values
        feature_names = preprocessor.get_feature_names_out()
        explanations = []
        for i in range(len(shap_results)):
            row_shap = shap_results[i]
            contribs = {}
            for j in range(len(feature_names)):
                val = row_shap[j]
                contribs[feature_names[j]] = float(val[-1]) if hasattr(val, "__len__") and len(val) > 1 else float(val)
            explanations.append(contribs)
        if len(EXPLAIN_CACHE) >= MAX_CACHE_SIZE:
            EXPLAIN_CACHE.pop(next(iter(EXPLAIN_CACHE)))
        EXPLAIN_CACHE[payload_hash] = explanations
        return ExplainResponse(explainability=explanations)
    except Exception as e:
        logger.error(f"Explain error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/feedback")
async def feedback(request: FeedbackRequest):
    try:
        PerformanceTracker.log_feedback(request.request_ids, request.truths)
        return {"status": "Feedback securely logged and evaluated."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/alerts")
async def get_alerts():
    from src.monitoring.alerting import AlertManager
    return {"alerts": AlertManager.get_history()}


@app.get("/health")
async def health_check():
    return {
        "status": "ok" if PIPELINE is not None else "no_model",
        "pipeline_loaded": PIPELINE is not None,
        "explainer_loaded": EXPLAINER is not None,
    }
