import pickle
import numpy as np
from typing import Optional, Dict, List
import os

class SignLanguagePredictor:
    """Sign language prediction model wrapper"""
    
    def __init__(self, model_path: str, labels_dict: Dict[int, str]):
        """
        Initialize predictor
        
        Args:
            model_path: Path to the pickled model file
            labels_dict: Dictionary mapping label indices to letters
        """
        self.model = None
        self.model_path = model_path
        self.labels_dict = labels_dict
        self._load_model()
    
    def _load_model(self):
        """Load the trained model from pickle file"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            with open(self.model_path, 'rb') as f:
                model_dict = pickle.load(f)
            
            self.model = model_dict['model']
            print(f"✅ Model loaded successfully from {self.model_path}")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def predict(self, features: List[float]) -> Dict:
        """
        Make prediction from hand landmark features (optimized)

        Args:
            features: List of 42 normalized hand landmark features

        Returns:
            Dictionary containing prediction results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")

        if len(features) != 42:
            raise ValueError(f"Expected 42 features, got {len(features)}")

        try:
            # Convert to numpy array (float32 daha hızlı)
            features_array = np.asarray(features, dtype=np.float32).reshape(1, -1)

            # Make prediction
            prediction = self.model.predict(features_array)
            label_index = int(prediction[0])

            # Get the letter
            letter = self.labels_dict.get(label_index, None)

            # Get real confidence from model probabilities
            try:
                probabilities = self.model.predict_proba(features_array)
                confidence = float(np.max(probabilities))
            except Exception:
                # Fallback to predict if predict_proba not available
                confidence = 0.85

            return {
                'success': True,
                'letter': letter,
                'label_index': label_index,
                'confidence': confidence,
                'error': None
            }

        except Exception as e:
            return {
                'success': False,
                'letter': None,
                'label_index': None,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def get_labels(self) -> Dict[int, str]:
        """Get the labels dictionary"""
        return self.labels_dict
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None