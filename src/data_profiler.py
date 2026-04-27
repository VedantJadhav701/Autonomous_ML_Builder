import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from src.config import SystemConfig
from src.monitoring.logger import get_logger

logger = get_logger(__name__)

class DataProfiler:
    """Intelligently profiles and optimizes DataFrames for machine learning pipelines."""
    
    @staticmethod
    def optimize_memory(df: pd.DataFrame) -> pd.DataFrame:
        """
        Downcasts dtypes to optimize memory footprint globally.
        Forces constraints based on SystemConfig.
        """
        start_mem = df.memory_usage().sum() / 1024**2
        logger.info(f"Memory processing started: {start_mem:.2f} MB")
        
        for col in df.columns:
            col_type = df[col].dtype
            
            if col_type != object:
                c_min = df[col].min()
                c_max = df[col].max()
                
                if str(col_type)[:3] == 'int':
                    if c_min > np.iinfo(np.int8).min and c_max < np.iinfo(np.int8).max:
                        df[col] = df[col].astype(np.int8)
                    elif c_min > np.iinfo(np.int16).min and c_max < np.iinfo(np.int16).max:
                        df[col] = df[col].astype(np.int16)
                    elif c_min > np.iinfo(np.int32).min and c_max < np.iinfo(np.int32).max:
                        df[col] = df[col].astype(np.int32)
                else:
                    if c_min > np.finfo(np.float16).min and c_max < np.finfo(np.float16).max:
                        df[col] = df[col].astype(np.float32) # float32 for stability in ML
                    else:
                        df[col] = df[col].astype(np.float32)
                        
            elif str(col_type) == 'object':
                num_unique_values = len(df[col].unique())
                num_total_values = len(df[col])
                if num_unique_values / num_total_values < 0.5:
                    df[col] = df[col].astype('category')
                    
        end_mem = df.memory_usage().sum() / 1024**2
        logger.info(f"Memory processing completed: {end_mem:.2f} MB (Decreased by {100 * (start_mem - end_mem) / start_mem:.1f}%)")
        return df

    @staticmethod
    def identify_feature_types(df: pd.DataFrame, target_col: str) -> Dict[str, List[str]]:
        """
        Infers feature types avoiding memory costly pandas auto operations.
        Returns numerical, low_cardinality, and high_cardinality feature lists.
        """
        features = [col for col in df.columns if col != target_col]
        
        numerical = []
        low_cardinality = []
        high_cardinality = []
        to_drop = []
        
        for col in features:
            if pd.api.types.is_numeric_dtype(df[col]):
                numerical.append(col)
                continue
                
            n_unique = df[col].nunique()
            
            if n_unique > SystemConfig.MAX_CARDINALITY_LIMIT:
                logger.warning(f"Feature '{col}' exceeds maximum cardinality ({n_unique}). Dropping.")
                to_drop.append(col)
            elif n_unique > SystemConfig.HIGH_CARDINALITY_THRESHOLD:
                high_cardinality.append(col)
            else:
                low_cardinality.append(col)
                
        return {
            "numerical": numerical,
            "low_cardinality": low_cardinality,
            "high_cardinality": high_cardinality,
            "drop": to_drop
        }
        
    @staticmethod
    def profile_data(df: pd.DataFrame) -> Dict[str, Any]:
        """Legacy alias for identify_feature_types used in demo scripts."""
        layout = DataProfiler.identify_feature_types(df, target_col="")
        return {"feature_layout": layout}

    @staticmethod
    def profile_and_prepare(df: pd.DataFrame, target_col: str) -> Tuple[pd.DataFrame, pd.Series, Dict[str, List[str]]]:
        """Orchestrates memory optimization, profiling, and X/y split."""
        df_optimized = DataProfiler.optimize_memory(df)
        feature_layout = DataProfiler.identify_feature_types(df_optimized, target_col)
        
        # Drop excessive cardinality columns
        if feature_layout["drop"]:
            df_optimized.drop(columns=feature_layout["drop"], inplace=True)
            
        y = df_optimized[target_col]
        X = df_optimized.drop(columns=[target_col])
        return X, y, feature_layout
