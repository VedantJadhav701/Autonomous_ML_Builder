# Autonomous ML Builder - System Report

## Problem Definition
Developing an end-to-end, production-oriented Machine Learning system capable of autonomous feature inference, intelligent pipeline generation, model selection, hyperparameter tuning, and API deployment. The system must operate under stringent operational bounds: maximal bounds of 50,000 rows, 5MB files, 1GB memory cap, strict CPU execution, training limits of 5 minutes, and sub-10ms latency at inference without employing deep learning.

## Dataset Characteristics & Management
The system consumes tabular data. To enforce the 1GB RAM bounds:
- **Intelligent Downcasting**: Features are aggressively downcast leveraging minimum precision limits without sacrificing modeling fidelity (e.g., `int8`, `float32`).
- **Memory-Profiled Thresholds**: Datasets traversing 50,000 limits are safely downsampled prior to pipeline ingestion.

## Architecture and Model Choice
Data sparsity and dimensionality dictate model routing algorithmically:
1. **LogisticRegression** (Baseline/Linear): Selected when dimensionality exceeds sample ratios or when datasets are severely sparse.
2. **RandomForestClassifier** (Tree based): Triggered for highly noisy small dense datasets without high cardinality traits to avoid deep boosting overfitting.
3. **LightGBMClassifier** (Boosting): Default engine capable of histogram-aggregation resulting in sub-minute CPU processing over large dimensions.

All pipelines utilize Cardinality-Aware Engineering. Features > 10 distinct bounds are mapped via `TargetEncoder`, averting `OneHotEncoder` sparsity explosions. Feature thresholds natively cap feature scaling at `min(50, sqrt(n_samples * n_features))`.

## Performance Constraints & Optuna Search Space
Hyperparameter searches operate strictly against `3-Fold Stratified CV`. Search bounds terminate gracefully upon iterating 10 distinct trials or exceeding 60-second execution timelines.

## Explanatory WOW-Factor (SHAP Extraction)
As a rigorous defense against algorithmic black models, the platform isolates serialized Pipelines automatically rendering and dumping localized and global `shap` execution values bridging raw features to log-odds directly out of the tuned structure.

## Deployment Paradigm
The serialization process merges mappings, encoders, scale limits, and final tree regressors into a singular standalone `Joblib` instance. The corresponding `FastAPI` instance injects the pipeline symmetrically against Pydantic schema validation for Sub-10 millisecond isolated predictions. 

## Limitations & Risks
- **Extremely Imbalanced Constraints**: `class_weights` tuning might be bypassed due to severe Optuna restrictions.
- **Drift Ignorance**: Lacks a persistent database measuring upstream schema or covariate drift.
