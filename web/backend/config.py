import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask settings
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5001))
    
    # Model settings
    MODEL_PATH = os.getenv('MODEL_PATH', './models/combined_model.p')
    MIN_DETECTION_CONFIDENCE = float(os.getenv('MIN_DETECTION_CONFIDENCE', 0.3))
    MIN_TRACKING_CONFIDENCE = float(os.getenv('MIN_TRACKING_CONFIDENCE', 0.5))
    MAX_NUM_HANDS = int(os.getenv('MAX_NUM_HANDS', 1))  # Tek el - performans optimizasyonu
    
    # Timing settings
    LETTER_CONFIRMATION_DELAY = float(os.getenv('LETTER_CONFIRMATION_DELAY', 3.0))
    
    # CORS settings - Development ve production için farklı ayarlar
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,*')
    
    # Label dictionary (A-Z)
    LABELS_DICT = {i: chr(65 + i) for i in range(26)}

    # Redis settings
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    REDIS_SESSION_TTL = int(os.getenv('REDIS_SESSION_TTL', 86400))  # 24 hours
    REDIS_CACHE_TTL = int(os.getenv('REDIS_CACHE_TTL', 300))  # 5 minutes
    
    # Redis connection settings
    REDIS_CONNECTION_POOL_SIZE = int(os.getenv('REDIS_CONNECTION_POOL_SIZE', 10))
    REDIS_SOCKET_TIMEOUT = int(os.getenv('REDIS_SOCKET_TIMEOUT', 5))
    REDIS_SOCKET_CONNECT_TIMEOUT = int(os.getenv('REDIS_SOCKET_CONNECT_TIMEOUT', 5))
    
    # Debug settings
    SAVE_DEBUG_FRAMES = os.getenv('SAVE_DEBUG_FRAMES', 'false').lower() in ('1', 'true', 'yes')
    DEBUG_FRAME_INTERVAL = int(os.getenv('DEBUG_FRAME_INTERVAL', 20))
    ENABLE_PREPROCESSING = os.getenv('ENABLE_PREPROCESSING', 'false').lower() in ('1', 'true', 'yes')  # Performans için kapalı
    PREPROCESS_GAMMA = float(os.getenv('PREPROCESS_GAMMA', 1.3))  # >1.0 daha parlak
    
    @staticmethod
    def validate():
        """Validate configuration"""
        if not os.path.exists(Config.MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {Config.MODEL_PATH}")
        return True