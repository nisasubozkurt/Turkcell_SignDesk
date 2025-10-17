import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Tuple, List, Dict
from config import Config

class HandDetector:
    """MediaPipe hand detection wrapper optimized for performance"""

    def __init__(self, min_detection_confidence: float = 0.3, min_tracking_confidence: float = 0.5):
        """
        Initialize hand detector

        Args:
            min_detection_confidence: Minimum confidence for hand detection
        """
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        # Single optimized instance - stream mode with lite model
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            model_complexity=0,  # 0=Lite model (en hızlı), 1=Full model
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            max_num_hands=1  # Tek el yeterli - performans için optimize
        )
        
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a frame and detect hands (optimized - single pass)

        Args:
            frame: BGR image from OpenCV

        Returns:
            Dictionary containing detection results
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame (single pass - no fallback)
        results = self.hands.process(frame_rgb)

        # Prepare response
        response = {
            'hand_detected': False,
            'landmarks': None,
            'normalized_landmarks': None,
            'bounding_box': None,
            'features': None
        }

        if results.multi_hand_landmarks:
            # Get the first hand (we only process one hand)
            hand_landmarks = results.multi_hand_landmarks[0]

            # Extract landmarks
            landmarks = []
            x_coords = []
            y_coords = []

            for landmark in hand_landmarks.landmark:
                landmarks.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z
                })
                x_coords.append(landmark.x)
                y_coords.append(landmark.y)

            # Calculate bounding box
            h, w, _ = frame.shape
            x_min, x_max = min(x_coords), max(x_coords)
            y_min, y_max = min(y_coords), max(y_coords)

            bounding_box = {
                'x1': int(x_min * w) - 10,
                'y1': int(y_min * h) - 10,
                'x2': int(x_max * w) + 10,
                'y2': int(y_max * h) + 10
            }

            # Normalize coordinates for model input
            features = self._extract_features(hand_landmarks)

            response.update({
                'hand_detected': True,
                'landmarks': landmarks,
                'bounding_box': bounding_box,
                'features': features
            })

        return response
    
    def _extract_features(self, hand_landmarks) -> List[float]:
        """
        Extract and normalize features for model prediction
        
        Args:
            hand_landmarks: MediaPipe hand landmarks
            
        Returns:
            List of 42 normalized features (21 landmarks × 2 coordinates)
        """
        data_aux = []
        x_coords = []
        y_coords = []
        
        # Collect all coordinates
        for landmark in hand_landmarks.landmark:
            x_coords.append(landmark.x)
            y_coords.append(landmark.y)
        
        # Normalize coordinates relative to the hand's bounding box
        x_min = min(x_coords)
        y_min = min(y_coords)
        
        for landmark in hand_landmarks.landmark:
            data_aux.append(landmark.x - x_min)
            data_aux.append(landmark.y - y_min)
        
        # Ensure exactly 42 features
        if len(data_aux) > 42:
            data_aux = data_aux[:42]
        elif len(data_aux) < 42:
            # Pad with zeros if needed (shouldn't happen normally)
            data_aux.extend([0.0] * (42 - len(data_aux)))
        
        return data_aux
    
    def draw_landmarks(self, frame: np.ndarray, landmarks: List[Dict]) -> np.ndarray:
        """
        Draw hand landmarks on frame (optional, for debugging)
        
        Args:
            frame: BGR image
            landmarks: List of landmark dictionaries
            
        Returns:
            Frame with drawn landmarks
        """
        # This is optional and can be used for debugging
        # Not needed for API but kept for completeness
        return frame
    
    def close(self):
        """Close the hand detector"""
        if hasattr(self, 'hands') and self.hands:
            self.hands.close()