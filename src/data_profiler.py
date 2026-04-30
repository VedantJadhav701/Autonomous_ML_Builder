import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

# Cardinality thresholds
HIGH_CARDINALITY_THRESHOLD = 20
MAX_CARDINALITY_LIMIT = 200
NAN_DROP_THRESHOLD = 0.9     # drop columns with >90% NaN
MIN_VARIANCE_THRESHOLD = 1e-8  # drop near-constant numeric columns


class DataProfiler:
    """Intelligently profiles and optimizes DataFrames for machine learning pipelines."""

    @staticmethod
    def suggest_target_column(df: pd.DataFrame) -> str:
        """Heuristically guesses the target column (the 'y' variable)."""
        cols_lower = [str(c).lower() for c in df.columns]
        
        # 1. Exact matches for common target names (highest priority)
        priority_keywords = ['target', 'label', 'y', 'class', 'status', 'default']
        for kw in priority_keywords:
            if kw in cols_lower:
                return df.columns[cols_lower.index(kw)]
                
        # 2. Substring matches for prediction targets
        substring_keywords = ['price', 'output', 'prediction', 'result', 'revenue', 'score', 'outcome', 'value']
        for kw in substring_keywords:
            for i, col in enumerate(cols_lower):
                if kw in col:
                    return df.columns[i]
        
        # 3. Default to the last column (Standard ML practice)
        return df.columns[-1]

    @staticmethod
    def extract_datetime_features(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
        """
        Detects date-like strings and extracts numeric features (Year, Month, Day, DayOfWeek).
        """
        for col in df.columns:
            if col == target_col:
                continue
            
            if df[col].dtype == object:
                # Heuristic: try to parse as datetime if string looks like it contains dates
                # (simple check: at least 30% of the data should be parseable)
                sample = df[col].dropna().head(100)
                if len(sample) == 0: continue
                
                try:
                    # Attempt to convert to datetime
                    dates = pd.to_datetime(df[col], errors='coerce')
                    valid_ratio = dates.notna().sum() / len(df)
                    
                    if valid_ratio > 0.3:
                        logger.info(f"Extracting temporal features from '{col}' (valid date ratio: {valid_ratio:.1%})")
                        df[f"{col}_year"] = dates.dt.year.fillna(dates.dt.year.median() if not dates.dt.year.isna().all() else 0).astype(int)
                        df[f"{col}_month"] = dates.dt.month.fillna(0).astype(int)
                        df[f"{col}_day"] = dates.dt.day.fillna(0).astype(int)
                        df[f"{col}_dow"] = dates.dt.dayofweek.fillna(0).astype(int)
                        df = df.drop(columns=[col])
                except Exception as e:
                    logger.debug(f"Failed to parse '{col}' as datetime: {e}")
        
        return df

    @staticmethod
    def drop_bad_columns(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
        """
        Drops columns that are useless or harmful before training:
        - >90% NaN
        - Constant / near-zero variance (numeric)
        - Likely ID columns (unique ratio > 95% AND integer/object)
        """
        to_drop = []
        n = len(df)

        for col in df.columns:
            if col == target_col:
                continue

            nan_ratio = df[col].isna().sum() / max(n, 1)
            if nan_ratio > NAN_DROP_THRESHOLD:
                logger.warning(f"Dropping '{col}': {nan_ratio:.1%} NaN values.")
                to_drop.append(col)
                continue

            if pd.api.types.is_numeric_dtype(df[col]):
                filled = df[col].dropna()
                if len(filled) > 0:
                    # Near-constant columns (zero useful information)
                    if filled.std() < MIN_VARIANCE_THRESHOLD:
                        logger.warning(f"Dropping '{col}': near-constant (std≈0).")
                        to_drop.append(col)
                        continue

                    # True ID columns: sequential integers (1,2,3...) OR name says "id/index"
                    # NOT high-cardinality real features like sqft, price, score
                    is_id_named = any(kw in col.lower() for kw in ["_id", "id_", " id", "index", "rownum", "row_num"])
                    if pd.api.types.is_integer_dtype(df[col]) and not is_id_named:
                        col_min, col_max = int(filled.min()), int(filled.max())
                        unique_count = filled.nunique()
                        # Sequential IDs have max-min+1 ≈ count (range matches count)
                        is_sequential = (col_max - col_min + 1) <= n * 1.05 and unique_count >= n * 0.95
                        if is_sequential:
                            logger.warning(f"Dropping '{col}': sequential integer ID column (range={col_min}-{col_max}).")
                            to_drop.append(col)
                            continue
                    elif is_id_named:
                        unique_ratio = filled.nunique() / max(n, 1)
                        if unique_ratio > 0.95:
                            logger.warning(f"Dropping '{col}': ID-named column with unique={unique_ratio:.1%}.")
                            to_drop.append(col)
                            continue
            else:
                # Object/string columns where every row is unique → IDs or free text
                unique_ratio = df[col].nunique() / max(n, 1)
                is_id_named = any(kw in col.lower() for kw in ["_id", "id_", " id", "index", "name", "uuid"])
                if unique_ratio > 0.95 and is_id_named:
                    logger.warning(f"Dropping '{col}': unique string ID column (unique={unique_ratio:.1%}).")
                    to_drop.append(col)
                    continue

        if to_drop:
            df = df.drop(columns=to_drop)
            logger.info(f"Dropped {len(to_drop)} low-quality columns: {to_drop}")
        return df


    @staticmethod
    def optimize_memory(df: pd.DataFrame) -> pd.DataFrame:
        start_mem = df.memory_usage(deep=True).sum() / 1024 ** 2
        logger.info(f"Memory processing started: {start_mem:.2f} MB")

        for col in df.columns:
            col_type = df[col].dtype

            if col_type == object:
                n_unique = df[col].nunique()
                n_total = len(df[col])
                if n_unique / max(n_total, 1) < 0.5:
                    df[col] = df[col].astype("category")
            elif str(col_type).startswith("int"):
                c_min, c_max = df[col].min(), df[col].max()
                if c_min > np.iinfo(np.int8).min and c_max < np.iinfo(np.int8).max:
                    df[col] = df[col].astype(np.int8)
                elif c_min > np.iinfo(np.int16).min and c_max < np.iinfo(np.int16).max:
                    df[col] = df[col].astype(np.int16)
                elif c_min > np.iinfo(np.int32).min and c_max < np.iinfo(np.int32).max:
                    df[col] = df[col].astype(np.int32)
            elif str(col_type).startswith("float"):
                df[col] = df[col].astype(np.float32)

        end_mem = df.memory_usage(deep=True).sum() / 1024 ** 2
        pct = (start_mem - end_mem) / max(start_mem, 1e-9) * 100
        logger.info(f"Memory processing completed: {end_mem:.2f} MB (↓{pct:.1f}%)")
        return df

    @staticmethod
    def identify_feature_types(df: pd.DataFrame, target_col: str) -> Dict[str, List[str]]:
        """Infers feature types and returns numerical / low_cardinality / high_cardinality / drop lists."""
        features = [col for col in df.columns if col != target_col]

        numerical, low_cardinality, high_cardinality, to_drop = [], [], [], []

        for col in features:
            # Treat category dtype as low cardinality categorical
            if pd.api.types.is_categorical_dtype(df[col]):
                n_unique = df[col].nunique()
                if n_unique > MAX_CARDINALITY_LIMIT:
                    logger.warning(f"'{col}' exceeds cardinality limit ({n_unique}). Dropping.")
                    to_drop.append(col)
                elif n_unique > HIGH_CARDINALITY_THRESHOLD:
                    high_cardinality.append(col)
                else:
                    low_cardinality.append(col)
                continue

            if pd.api.types.is_numeric_dtype(df[col]):
                numerical.append(col)
                continue

            # object dtype
            n_unique = df[col].nunique()
            if n_unique > MAX_CARDINALITY_LIMIT:
                logger.warning(f"'{col}' exceeds cardinality limit ({n_unique}). Dropping.")
                to_drop.append(col)
            elif n_unique > HIGH_CARDINALITY_THRESHOLD:
                high_cardinality.append(col)
            else:
                low_cardinality.append(col)

        return {
            "numerical": numerical,
            "low_cardinality": low_cardinality,
            "high_cardinality": high_cardinality,
            "drop": to_drop,
        }

    @staticmethod
    def profile_and_prepare(df: pd.DataFrame, target_col: str) -> Tuple[pd.DataFrame, pd.Series, Dict[str, List[str]]]:
        """Full pipeline: drop bad cols → memory optimize → profile → X/y split."""
        # Step 0: Extract temporal features from dates
        df = DataProfiler.extract_datetime_features(df, target_col)

        # Step 1: drop useless columns
        df = DataProfiler.drop_bad_columns(df, target_col)

        # Step 2: fill NaNs in target with mode/median before splitting
        if df[target_col].isna().any():
            if pd.api.types.is_numeric_dtype(df[target_col]):
                df[target_col] = df[target_col].fillna(df[target_col].median())
            else:
                df[target_col] = df[target_col].fillna(df[target_col].mode()[0])

        # Step 3: memory optimize (features only, keep target pristine)
        target_series = df[target_col].copy()
        df_features = df.drop(columns=[target_col])
        df_features = DataProfiler.optimize_memory(df_features)
        df = pd.concat([df_features, target_series], axis=1)

        # Step 4: identify feature types
        feature_layout = DataProfiler.identify_feature_types(df, target_col)

        # Drop extreme cardinality columns
        if feature_layout["drop"]:
            df = df.drop(columns=feature_layout["drop"], errors="ignore")

        y = df[target_col]
        X = df.drop(columns=[target_col])
        return X, y, feature_layout

    @staticmethod
    def build_feature_schema(df_raw: pd.DataFrame, target_col: str) -> Dict[str, Dict]:
        """
        Builds a feature schema dict for the frontend dynamic form.
        Each feature: { "type": "number"|"text", "values": [...] | null, "sample": any }
        """
        schema = {}
        for col in df_raw.columns:
            if col == target_col:
                continue
            series = df_raw[col].dropna()
            if len(series) == 0:
                continue
            if pd.api.types.is_numeric_dtype(series):
                schema[col] = {
                    "type": "number",
                    "values": None,
                    "sample": float(round(series.median(), 4)),
                }
            else:
                unique_vals = [str(v) for v in series.unique().tolist()[:20]]
                schema[col] = {
                    "type": "text",
                    "values": unique_vals,
                    "sample": str(series.mode()[0]) if len(series) > 0 else "",
                }
        return schema
