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

app = FastAPI(title="Autonomous ML Builder API", version="2.0.0")

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
    MODEL_METADATA = ModelArtifactTracker.load_metadata()
    logger.info("Pipeline and Explainer loaded successfully for inference.")
except Exception as e:
    logger.error(f"Failed to load artifacts: {e}")
    PIPELINE = None
    EXPLAINER = None
    MODEL_METADATA = None

EXPLAIN_CACHE: dict = {}
MAX_CACHE_SIZE = 100

# ── Training job registry ────────────────────────────────────────────────────
JOBS: dict = {}

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
    JOBS[job_id].update({
        "stage": STAGE_LABELS[step_idx],
        "step": step_idx + 1,
        "progress": int((step_idx / TOTAL_STEPS) * 100),
    })


def _run_training(job_id: str, csv_bytes: bytes, target_col: str, task_type: str):
    """Background training thread — robust 6-stage pipeline for any dataset."""
    global PIPELINE, EXPLAINER, MODEL_METADATA

    JOBS[job_id] = {"stage": "Starting", "step": 0, "progress": 0,
                    "status": "running", "result": None, "error": None}
    t_start = time.time()

    try:
        # ── Stage 1: Profile Data ────────────────────────────────────────────
        _set_stage(job_id, 0)
        from src.data_profiler import DataProfiler

        df_raw = pd.read_csv(io.BytesIO(csv_bytes))

        # Row cap
        MAX_ROWS = 50_000
        if len(df_raw) > MAX_ROWS:
            df_raw = df_raw.sample(MAX_ROWS, random_state=42).reset_index(drop=True)
            logger.warning(f"Dataset sampled to {MAX_ROWS} rows.")

        if target_col not in df_raw.columns:
            raise ValueError(f"Target column '{target_col}' not found in CSV. "
                             f"Available: {list(df_raw.columns)}")

        # ── Detect task type from RAW data (before any dtype mutation) ───────
        raw_target = df_raw[target_col].dropna()
        n_unique_raw = int(raw_target.nunique())
        n_total_raw  = len(raw_target)
        is_float_target = pd.api.types.is_float_dtype(raw_target)
        is_continuous = is_float_target and n_unique_raw > max(20, 0.05 * n_total_raw)
        is_str_target = raw_target.dtype == object

        if task_type == "auto":
            is_regression = is_continuous and not is_str_target
        elif task_type == "regression":
            is_regression = True
        else:
            is_regression = False

        logger.info(
            f"Task type → {'REGRESSION' if is_regression else 'CLASSIFICATION'} "
            f"(dtype={raw_target.dtype}, unique={n_unique_raw}/{n_total_raw})"
        )

        # Build feature schema from raw data (for dynamic frontend form)
        feature_schema = DataProfiler.build_feature_schema(df_raw, target_col)

        # Profile and prepare (robust, drops bad columns internally)
        X, y, feature_layout = DataProfiler.profile_and_prepare(df_raw.copy(), target_col)
        n_samples, n_features = X.shape
        logger.info(f"Profiled: {n_samples} rows × {n_features} features")

        if n_features == 0:
            raise ValueError("No usable features found after profiling. "
                             "Check that the dataset has feature columns besides the target.")

        # ── Stage 2: Feature Engineering ────────────────────────────────────
        _set_stage(job_id, 1)
        from src.feature_engineering import FeatureEngineeringPipeline
        from src.models import ModelSelectionEngine
        from lightgbm import LGBMClassifier, LGBMRegressor
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

        _candidate = ModelSelectionEngine.get_model_candidate(
            n_samples, n_features, is_sparse=False, is_regression=is_regression
        )
        is_tree = isinstance(_candidate, (LGBMClassifier, LGBMRegressor,
                                          RandomForestClassifier, RandomForestRegressor))
        preprocessor = FeatureEngineeringPipeline.build_preprocessor(
            feature_layout, is_tree_model=is_tree
        )

        # ── Stage 3: Select Model ────────────────────────────────────────────
        _set_stage(job_id, 2)
        model = ModelSelectionEngine.get_model_candidate(
            n_samples, n_features, is_sparse=False, is_regression=is_regression
        )
        model_name = type(model).__name__
        logger.info(f"Selected model: {model_name}")

        unified_pipeline = ModelSelectionEngine.create_unified_pipeline(preprocessor, model)
        param_grid = ModelSelectionEngine.get_param_grid(model)

        # ── Stage 4: Train + Tune ────────────────────────────────────────────
        _set_stage(job_id, 3)
        from src.tuner import HyperparameterTuner
        from sklearn.model_selection import train_test_split

        # Encode string targets for classification to prevent LightGBM/RF crashes
        target_mapping = None
        if not is_regression and (y.dtype == object or str(y.dtype) == 'category' or y.dtype == str):
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            y = pd.Series(le.fit_transform(y), index=y.index)
            target_mapping = {str(i): str(c) for i, c in enumerate(le.classes_)}

        # Never stratify for regression or when target has many unique values
        use_stratify = (not is_regression) and (y.nunique() <= max(50, 0.1 * n_samples))
        stratify_arg = y if use_stratify else None

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=stratify_arg
        )
        tuned_pipeline = HyperparameterTuner.tune(
            unified_pipeline, param_grid, X_train, y_train, is_regression=is_regression
        )

        # ── Stage 5: Evaluate ────────────────────────────────────────────────
        _set_stage(job_id, 4)
        from src.evaluation import EvaluationEngine
        metrics = EvaluationEngine.evaluate_model(tuned_pipeline, X_test, y_test)
        explainer = EvaluationEngine.generate_shap_report(
            tuned_pipeline, X_train, is_tree_model=is_tree
        )

        # Feature importance via SHAP
        feature_importance: dict = {}
        try:
            preprocessor_fitted = tuned_pipeline.named_steps["preprocessor"]
            feat_names = list(preprocessor_fitted.get_feature_names_out())
            sample = X_train.head(min(200, len(X_train)))
            X_tr = preprocessor_fitted.transform(sample)
            if hasattr(X_tr, "toarray"):
                X_tr = X_tr.toarray()
            if explainer is not None:
                raw_shap = explainer.shap_values(X_tr)
                if isinstance(raw_shap, list):
                    shap_arr = np.abs(raw_shap[-1])
                elif raw_shap.ndim == 3:
                    shap_arr = np.abs(raw_shap[:, :, -1])
                else:
                    shap_arr = np.abs(raw_shap)
                mean_abs = shap_arr.mean(axis=0)
                if len(mean_abs) == len(feat_names):
                    feature_importance = {
                        feat_names[i]: float(mean_abs[i]) for i in range(len(feat_names))
                    }
                    feature_importance = dict(
                        sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:12]
                    )
        except Exception as ex:
            logger.warning(f"Feature importance extraction failed (non-fatal): {ex}")

        # ── Stage 6: Deploy ──────────────────────────────────────────────────
        _set_stage(job_id, 5)

        # Build and save metadata
        metadata = {
            "features": feature_schema,
            "task_type": "regression" if is_regression else "classification",
            "target_col": target_col,
            "model_name": model_name,
            "n_samples": n_samples,
            "n_features": n_features,
            "target_mapping": target_mapping,
        }
        ModelArtifactTracker.save_pipeline(tuned_pipeline, explainer, metadata=metadata)

        # Hot-swap global inference state
        PIPELINE = tuned_pipeline
        EXPLAINER = explainer
        MODEL_METADATA = metadata
        EXPLAIN_CACHE.clear()
        logger.info("Hot-swap complete — new model is live for inference.")

        elapsed = round(time.time() - t_start, 1)
        JOBS[job_id].update({
            "stage": "Complete",
            "step": TOTAL_STEPS,
            "progress": 100,
            "status": "done",
            "result": {
                "model_name": model_name,
                "task_type": "regression" if is_regression else "classification",
                "metrics": metrics,
                "training_time_sec": elapsed,
                "feature_importance": feature_importance,
                "n_samples": n_samples,
                "n_features": n_features,
            },
        })

    except Exception as e:
        logger.error(f"Training job {job_id} failed: {e}", exc_info=True)
        JOBS[job_id].update({"status": "failed", "error": str(e), "progress": -1})


# ── Training endpoints ───────────────────────────────────────────────────────

@app.post("/train")
async def start_training(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_column: str = Form(...),
    task_type: str = Form("auto"),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    csv_bytes = await file.read()
    if len(csv_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5 MB limit.")

    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"stage": "Queued", "step": 0, "progress": 0,
                    "status": "queued", "result": None, "error": None}
    thread = threading.Thread(
        target=_run_training,
        args=(job_id, csv_bytes, target_column, task_type),
        daemon=True,
    )
    thread.start()
    return {"job_id": job_id}


@app.get("/status/{job_id}")
async def job_status(job_id: str):
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
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    job = JOBS[job_id]
    if job["status"] != "done":
        raise HTTPException(status_code=400, detail=f"Job not complete (status: {job['status']}).")
    return job["result"]


@app.get("/metadata")
async def get_metadata():
    """Returns saved feature schema so the frontend can build a dynamic inference form."""
    meta = MODEL_METADATA or ModelArtifactTracker.load_metadata()
    if meta is None:
        return {"available": False}
    return {"available": True, **meta}


# ── Inference endpoints ──────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="No model loaded. Train a model first.")
    try:
        input_data = [item.model_dump() for item in request.data]
        df = pd.DataFrame(input_data)
        n_rows = len(df)
        request_ids = (
            request.request_ids
            if request.request_ids and len(request.request_ids) == n_rows
            else [str(uuid.uuid4()) for _ in range(n_rows)]
        )
        try:
            DriftDetector.check_drift(df)
        except Exception:
            pass  # drift detection is non-fatal
        preds = PIPELINE.predict(df)
        preds_list = preds.tolist() if hasattr(preds, "tolist") else list(preds)
        
        if MODEL_METADATA and MODEL_METADATA.get("target_mapping"):
            mapping = MODEL_METADATA["target_mapping"]
            preds_list = [mapping.get(str(p), p) for p in preds_list]

        try:
            PerformanceTracker.stage_predictions(request_ids, preds_list)
        except Exception:
            pass
        return PredictionResponse(predictions=preds_list, request_ids=request_ids)
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
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

        raw_shap = EXPLAINER(X_transformed).values if callable(EXPLAINER) else EXPLAINER.shap_values(X_transformed)
        feature_names = list(preprocessor.get_feature_names_out())

        # Normalise shape: handle (n, f), (n, f, c) and list-of-arrays
        if isinstance(raw_shap, list):
            shap_arr = raw_shap[-1]  # last class for binary
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
            shap_arr = raw_shap[:, :, -1]
        else:
            shap_arr = raw_shap

        explanations = []
        for i in range(len(shap_arr)):
            row_shap = shap_arr[i]
            contribs = {}
            for j in range(min(len(feature_names), len(row_shap))):
                val = row_shap[j]
                contribs[feature_names[j]] = float(val) if np.isscalar(val) else float(val[-1])
            explanations.append(contribs)

        if len(EXPLAIN_CACHE) >= MAX_CACHE_SIZE:
            EXPLAIN_CACHE.pop(next(iter(EXPLAIN_CACHE)))
        EXPLAIN_CACHE[payload_hash] = explanations
        return ExplainResponse(explainability=explanations)
    except Exception as e:
        logger.error(f"Explain error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/feedback")
async def feedback(request: FeedbackRequest):
    try:
        PerformanceTracker.log_feedback(request.request_ids, request.truths)
        return {"status": "Feedback logged."}
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
        "model_name": MODEL_METADATA.get("model_name") if MODEL_METADATA else None,
        "task_type": MODEL_METADATA.get("task_type") if MODEL_METADATA else None,
    }


@app.get("/download-model")
async def download_model(format: str = "joblib"):
    """Download the trained pipeline as .joblib or .pkl file."""
    import tempfile, shutil
    from fastapi.responses import FileResponse

    if PIPELINE is None:
        raise HTTPException(status_code=503, detail="No model trained yet. Train a model first.")

    allowed = {"joblib", "pkl"}
    if format not in allowed:
        raise HTTPException(status_code=400, detail=f"Format must be one of: {allowed}")

    model_name = (MODEL_METADATA or {}).get("model_name", "model")
    task_type  = (MODEL_METADATA or {}).get("task_type", "model")
    filename   = f"autonomous_ml_{model_name}_{task_type}.{format}"

    # Write to a temp file so FileResponse can serve it
    tmp_path = os.path.join(tempfile.gettempdir(), filename)
    joblib.dump(PIPELINE, tmp_path)

    return FileResponse(
        path=tmp_path,
        media_type="application/octet-stream",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
