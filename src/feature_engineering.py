from typing import Dict, List, Any
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from sklearn.feature_selection import SelectKBest, f_classif
from category_encoders import TargetEncoder
from src.logger import get_logger

logger = get_logger(__name__)

class FeatureEngineeringPipeline:
    """Creates an adaptive sklearn ColumnTransformer based on feature cardinality."""
    
    @staticmethod
    def build_preprocessor(feature_layout: Dict[str, List[str]], is_tree_model: bool) -> ColumnTransformer:
        """
        Builds the preprocessing ColumnTransformer.
        Applies RobustScaler conditionally.
        Uses TargetEncoder for high cardinality features.
        """
        transformers = []
        
        # 1. Numerical Pipeline
        if feature_layout.get("numerical"):
            num_steps = [('imputer', SimpleImputer(strategy='median'))]
            if not is_tree_model:
                num_steps.append(('scaler', RobustScaler()))
            transformers.append(('num', Pipeline(num_steps), feature_layout["numerical"]))
            
        # 2. Low Cardinality Categorical Pipeline (OneHotEncoding)
        if feature_layout.get("low_cardinality"):
            low_card_steps = [
                ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
                ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]
            transformers.append(('low_cat', Pipeline(low_card_steps), feature_layout["low_cardinality"]))
            
        # 3. High Cardinality Categorical Pipeline (TargetEncoding)
        if feature_layout.get("high_cardinality"):
            high_card_steps = [
                ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
                ('target_enc', TargetEncoder(handle_unknown='value'))
            ]
            transformers.append(('high_cat', Pipeline(high_card_steps), feature_layout["high_cardinality"]))
            
        preprocessor = ColumnTransformer(transformers=transformers, n_jobs=-1, remainder='drop')
        logger.info(f"Preprocessor built with {len(transformers)} transformers. (Tree Model: {is_tree_model})")
        return preprocessor
        
    @staticmethod
    def get_adaptive_feature_limit(n_samples: int, n_features: int) -> int:
        """Adaptive feature limit to strictly control memory."""
        computed_limit = int(np.sqrt(n_samples * n_features))
        limit = min(50, computed_limit)
        limit = max(1, limit) # Ensure at least 1 feature is selected
        logger.info(f"Adaptive feature limit set to {limit} limit (samples={n_samples}, features={n_features})")
        return limit
