import pandas as pd
from src.input_validator import InputValidator
from src.data_profiler import DataProfiler
from src.feature_engineering import FeatureEngineeringPipeline
from src.models import ModelSelectionEngine
from src.tuner import HyperparameterTuner
from src.evaluation import EvaluationEngine
from src.tracker import ModelArtifactTracker
from src.monitoring.drift_detector import DriftDetector

def run_training_pipeline():
    print("🚀 Starting Autonomous Training Lifecycle...")
    
    # 1. Loading & Validation
    df = InputValidator.load_and_validate_schema("credit_risk_sample.csv", target_col="loan_status")
    
    # 2. Profiling
    X = df.drop(columns=["loan_status"])
    y = df["loan_status"]
    profile = DataProfiler.profile_data(X)
    
    # 3. Preprocessing
    preprocessor = FeatureEngineeringPipeline.build_preprocessor(profile["feature_layout"], is_tree_model=True)
    
    # 4. Model Selection & Tuning
    base_model = ModelSelectionEngine.get_model_candidate(len(df), X.shape[1], is_sparse=False)
    pipeline = ModelSelectionEngine.create_unified_pipeline(preprocessor, base_model)
    
    # We use a very small trial count for demo speed
    best_pipeline = HyperparameterTuner.tune(pipeline, {}, X, y)
    
    # 5. Explainability & Artifacts
    explainer = EvaluationEngine.generate_shap_report(best_pipeline, X, is_tree_model=True)
    
    # 6. Save Baselines for Drift
    DriftDetector.calculate_baselines(X)
    
    # 7. Serialize Unified Bundle
    ModelArtifactTracker.save_pipeline(best_pipeline, explainer)
    
    print("\n✅ Training Complete. models/unified_pipeline.joblib and models/shap_explainer.joblib created.")
    print("You can now run 'uvicorn app.main:app' and then 'python demo_lifecycle.py'.")

if __name__ == "__main__":
    run_training_pipeline()
