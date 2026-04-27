import os
import pandas as pd
from typing import Tuple
from src.config import SystemConfig
from src.logger import get_logger

logger = get_logger(__name__)

class DataValidationError(Exception):
    """Custom exception for data validation failures."""
    pass

class InputValidator:
    """Validates input datasets against system constraints before processing."""
    
    @staticmethod
    def validate_file_size(file_path: str) -> bool:
        """Checks if the file exceeds the maximum allowed file size constraint (5MB)."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset not found at {file_path}")
            
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        logger.info(f"Checking dataset size: {file_size_mb:.2f} MB")
        
        if file_size_mb > SystemConfig.MAX_FILE_SIZE_MB:
            logger.warning(
                f"File size {file_size_mb:.2f}MB exceeds limit of {SystemConfig.MAX_FILE_SIZE_MB}MB. "
                "Enforcing limits may require chunking or sampling."
            )
            # Depending on strictness, we might raise or just warn.
            # We raise to adhere STRICTLY to the constraints.
            raise DataValidationError(
                f"File size {file_size_mb:.2f}MB exceeds strict constraint of {SystemConfig.MAX_FILE_SIZE_MB}MB"
            )
            
        return True

    @staticmethod
    def load_and_validate_schema(file_path: str, target_col: str) -> pd.DataFrame:
        """
        Loads the dataset, enforces row constraints, and validates schema (target existence).
        """
        InputValidator.validate_file_size(file_path)
        
        logger.info("Loading dataset into memory...")
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            raise DataValidationError(f"Failed to parse CSV file: {str(e)}")
            
        # Target Existence Verification
        if target_col not in df.columns:
            logger.error(f"Target column '{target_col}' missing from dataset.")
            raise DataValidationError(f"Target column '{target_col}' not found. Available: {list(df.columns)}")
            
        # Enforce Row Limits
        num_rows = len(df)
        if num_rows > SystemConfig.MAX_ROWS:
            logger.warning(f"Dataset has {num_rows} rows. Downsampling to {SystemConfig.MAX_ROWS} to respect constraints.")
            df = df.sample(n=SystemConfig.MAX_ROWS, random_state=42).reset_index(drop=True)
            
        logger.info(f"Dataset validated successfully. Final shape: {df.shape}")
        return df

