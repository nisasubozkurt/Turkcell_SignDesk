from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from datetime import datetime, timedelta
import traceback
from io import BytesIO
from PIL import Image
import os
import threading
import time
from collections import defaultdict, deque
from functools import wraps

from config import Config
from utils.hand_detector import HandDetector
from utils.predictor import SignLanguagePredictor
from utils.redis_manager import redis_manager

# Initialize Flask app
app = Flask(__name__)

# Configure CORS - Tamamen açık CORS ayarları (development için)
CORS(app, 
     origins="*",
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["*"],
     supports_credentials=False,
     max_age=3600
)

# Ek CORS middleware - tüm response'lara CORS header'ları ekle
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Max-Age'] = '3600'
    
    return response

# Global instances
hand_detector = None
predictor = None
request_counter = 0

# Performance optimization - Rate limiting and request throttling
REQUEST_LIMITS = defaultdict(lambda: deque())
REQUEST_LOCK = threading.Lock()
MAX_REQUESTS_PER_MINUTE = 60  # Her IP için dakikada maksimum istek
MIN_REQUEST_INTERVAL = 0.1    # Minimum istek aralığı (saniye)

# Smart caching for recent predictions (very short TTL for real-time)
PREDICTION_CACHE = {}
CACHE_LOCK = threading.Lock()
CACHE_SIZE = 50  # Reduced cache size for real-time
CACHE_TTL = 0.1  # 100ms cache - only for rapid duplicate frames

# Global state lock
STATE_LOCK = threading.Lock()

# Global state tracking
GLOBAL_STATE = {
    'total_requests': 0,
    'successful_requests': 0,
    'failed_requests': 0,
    'cache_hits': 0,
    'cache_misses': 0,
    'average_response_time': 0.0,
    'active_sessions': set(),
    'session_stats': defaultdict(lambda: {
        'request_count': 0,
        'last_activity': time.time(),
        'total_time': 0.0
    })
}

# Session data storage - her session için ayrı veri
SESSIONS = defaultdict(lambda: {
    'created_at': time.time(),
    'last_activity': time.time(),
    'request_count': 0,
    'total_time': 0.0,
    'user_data': {},  # Kullanıcıya özel veriler
    'predictions': [],  # Son tahminler
    'word_history': [],  # Kelime geçmişi
    'settings': {  # Kullanıcı ayarları
        'confidence_threshold': 0.5,
        'letter_delay': 3000,
        'language': 'tr'
    }
})
SESSIONS_LOCK = threading.Lock()

def rate_limit(max_requests=60, window_seconds=60):
    """Rate limiting decorator (session-based, not IP-based)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Session bazlı rate limiting (IP yerine)
            session_id = request.headers.get('X-Session-ID', 'unknown')
            identifier = session_id if session_id != 'unknown' else request.remote_addr or 'unknown'
            now = time.time()

            with REQUEST_LOCK:
                # Clean old requests
                while REQUEST_LIMITS[identifier] and REQUEST_LIMITS[identifier][0] < now - window_seconds:
                    REQUEST_LIMITS[identifier].popleft()

                # Check if limit exceeded
                if len(REQUEST_LIMITS[identifier]) >= max_requests:
                    return jsonify({
                        "success": False,
                        "error": "Rate limit exceeded. Please slow down your requests.",
                        "retry_after": window_seconds
                    }), 429

                # Add current request
                REQUEST_LIMITS[identifier].append(now)

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def throttle_requests(min_interval=0.1):
    """Request throttling decorator"""
    last_request_time = {}
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr or 'unknown'
            now = time.time()
            
            if client_ip in last_request_time:
                time_since_last = now - last_request_time[client_ip]
                if time_since_last < min_interval:
                    return jsonify({
                        "success": False,
                        "error": "Request too frequent. Please wait.",
                        "retry_after": min_interval - time_since_last
                    }), 429
            
            last_request_time[client_ip] = now
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_cache_key(frame_data: str) -> str:
    """Generate cache key from frame data"""
    import hashlib
    return hashlib.md5(frame_data.encode()).hexdigest()[:16]

def get_cached_prediction(cache_key: str) -> dict:
    """Get cached prediction with Redis fallback"""
    # Try Redis first
    redis_data = redis_manager.get_cache(cache_key)
    if redis_data:
        return redis_data
    
    # Fallback to in-memory cache
    with CACHE_LOCK:
        if cache_key in PREDICTION_CACHE:
            cached_data, timestamp = PREDICTION_CACHE[cache_key]
            if time.time() - timestamp < CACHE_TTL:
                return cached_data
            else:
                # Remove expired cache
                del PREDICTION_CACHE[cache_key]
    return None

def set_cached_prediction(cache_key: str, prediction_data: dict):
    """Cache prediction result with Redis fallback"""
    # Try Redis first
    if redis_manager.set_cache(cache_key, prediction_data):
        return
    
    # Fallback to in-memory cache
    with CACHE_LOCK:
        # Clean old cache entries if cache is full
        if len(PREDICTION_CACHE) >= CACHE_SIZE:
            # Remove oldest entries
            oldest_keys = sorted(PREDICTION_CACHE.keys(), 
                               key=lambda k: PREDICTION_CACHE[k][1])[:CACHE_SIZE//2]
            for key in oldest_keys:
                del PREDICTION_CACHE[key]
        
        PREDICTION_CACHE[cache_key] = (prediction_data, time.time())

def get_session_data(session_id: str) -> dict:
    """Get session data with Redis fallback"""
    # Try Redis first
    redis_data = redis_manager.get_session_data(session_id)
    if redis_data:
        return redis_data
    
    # Fallback to in-memory storage
    with SESSIONS_LOCK:
        return SESSIONS[session_id].copy()

def update_session_data(session_id: str, data: dict):
    """Update session data with Redis fallback"""
    # Try Redis first
    if redis_manager.update_session_data(session_id, data):
        return
    
    # Fallback to in-memory storage
    with SESSIONS_LOCK:
        SESSIONS[session_id].update(data)
        SESSIONS[session_id]['last_activity'] = time.time()

def add_session_prediction(session_id: str, prediction: dict):
    """Add prediction to session history with Redis fallback"""
    # Try Redis first
    if redis_manager.add_session_prediction(session_id, prediction):
        return
    
    # Fallback to in-memory storage
    with SESSIONS_LOCK:
        session = SESSIONS[session_id]
        session['predictions'].append({
            'prediction': prediction,
            'timestamp': time.time()
        })
        # Keep only last 50 predictions
        if len(session['predictions']) > 50:
            session['predictions'] = session['predictions'][-50:]
        session['last_activity'] = time.time()

def add_session_word(session_id: str, word: str):
    """Add word to session history with Redis fallback"""
    # Try Redis first
    if redis_manager.add_session_word(session_id, word):
        return
    
    # Fallback to in-memory storage
    with SESSIONS_LOCK:
        session = SESSIONS[session_id]
        session['word_history'].append({
            'word': word,
            'timestamp': time.time()
        })
        # Keep only last 100 words
        if len(session['word_history']) > 100:
            session['word_history'] = session['word_history'][-100:]
        session['last_activity'] = time.time()

def cleanup_old_sessions():
    """Clean up sessions older than 24 hours"""
    # Try Redis cleanup first
    redis_cleaned = redis_manager.cleanup_expired_sessions()
    
    # Fallback to in-memory cleanup
    with SESSIONS_LOCK:
        current_time = time.time()
        expired_sessions = []
        
        for session_id, session_data in SESSIONS.items():
            if current_time - session_data['last_activity'] > 86400:  # 24 hours
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del SESSIONS[session_id]
    
    return redis_cleaned + len(expired_sessions)

def update_global_state(session_id: str, request_success: bool, response_time: float, cache_hit: bool = False):
    """Update global state tracking"""
    with STATE_LOCK:
        GLOBAL_STATE['total_requests'] += 1
        if request_success:
            GLOBAL_STATE['successful_requests'] += 1
        else:
            GLOBAL_STATE['failed_requests'] += 1
        
        if cache_hit:
            GLOBAL_STATE['cache_hits'] += 1
        else:
            GLOBAL_STATE['cache_misses'] += 1
        
        # Update average response time
        total_reqs = GLOBAL_STATE['total_requests']
        current_avg = GLOBAL_STATE['average_response_time']
        GLOBAL_STATE['average_response_time'] = ((current_avg * (total_reqs - 1)) + response_time) / total_reqs
        
        # Update session stats
        GLOBAL_STATE['active_sessions'].add(session_id)
        session_stats = GLOBAL_STATE['session_stats'][session_id]
        session_stats['request_count'] += 1
        session_stats['last_activity'] = time.time()
        session_stats['total_time'] += response_time

def get_global_state() -> dict:
    """Get current global state"""
    with STATE_LOCK:
        # Calculate cache hit rate
        total_cache_requests = GLOBAL_STATE['cache_hits'] + GLOBAL_STATE['cache_misses']
        cache_hit_rate = (GLOBAL_STATE['cache_hits'] / total_cache_requests * 100) if total_cache_requests > 0 else 0
        
        # Calculate error rate
        total_requests = GLOBAL_STATE['total_requests']
        error_rate = (GLOBAL_STATE['failed_requests'] / total_requests * 100) if total_requests > 0 else 0
        
        # Clean up old sessions (older than 1 hour)
        current_time = time.time()
        active_sessions = set()
        for session_id in GLOBAL_STATE['active_sessions']:
            if current_time - GLOBAL_STATE['session_stats'][session_id]['last_activity'] < 3600:  # 1 hour
                active_sessions.add(session_id)
        
        GLOBAL_STATE['active_sessions'] = active_sessions
        
        return {
            'total_requests': GLOBAL_STATE['total_requests'],
            'successful_requests': GLOBAL_STATE['successful_requests'],
            'failed_requests': GLOBAL_STATE['failed_requests'],
            'cache_hits': GLOBAL_STATE['cache_hits'],
            'cache_misses': GLOBAL_STATE['cache_misses'],
            'cache_hit_rate': round(cache_hit_rate, 2),
            'error_rate': round(error_rate, 2),
            'average_response_time': round(GLOBAL_STATE['average_response_time'], 3),
            'active_sessions_count': len(active_sessions),
            'timestamp': datetime.now().isoformat()
        }

def initialize_services():
    """Initialize hand detector and predictor"""
    global hand_detector, predictor
    
    try:
        print("🚀 Initializing services...")
        
        # Check if model file exists
        model_path = Config.MODEL_PATH
        if not os.path.exists(model_path):
            print(f"⚠️ Model file not found at {model_path}")
            # Try alternative paths
            alternative_paths = [
                './models/combined_model.p',
                '/app/models/combined_model.p',
                'models/combined_model.p',
                '/opt/signdesk/backend/models/combined_model.p',
                '/opt/signdesk/models/combined_model.p',
                'C:\\Users\\aslan\\Desktop\\web\\backend\\models\\combined_model.p'
            ]
            
            for alt_path in alternative_paths:
                if os.path.exists(alt_path):
                    print(f"✅ Found model at alternative path: {alt_path}")
                    model_path = alt_path
                    break
            else:
                print("❌ Model file not found in any alternative path")
                print("Available files:")
                for root, dirs, files in os.walk('.'):
                    for file in files:
                        if file.endswith('.p') or file.endswith('.pkl'):
                            print(f"  - {os.path.join(root, file)}")
                return False
        
        # Initialize hand detector
        print("📸 Loading MediaPipe Hand Detector...")
        hand_detector = HandDetector(
            min_detection_confidence=Config.MIN_DETECTION_CONFIDENCE
        )
        print("✅ Hand detector initialized")
        
        # Initialize predictor with found model path
        print(f"🤖 Loading ML Model from {model_path}...")
        predictor = SignLanguagePredictor(
            model_path=model_path,
            labels_dict=Config.LABELS_DICT
        )
        print("✅ Predictor initialized")
        
        print("🎉 All services initialized successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing services: {e}")
        traceback.print_exc()
        return False

def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode base64 string to OpenCV image (optimized)

    Args:
        base64_string: Base64 encoded image string

    Returns:
        OpenCV image (BGR format)
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',', 1)[1]

        # Decode base64 directly to numpy array (daha hızlı)
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)

        # Decode to OpenCV image (BGR format)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image data")

        return img

    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        is_healthy = (
            hand_detector is not None and 
            predictor is not None and 
            predictor.is_loaded()
        )
        
        return jsonify({
            "status": "healthy" if is_healthy else "unhealthy",
            "model_loaded": predictor.is_loaded() if predictor else False,
            "mediapipe_ready": hand_detector is not None,
            "timestamp": datetime.now().isoformat(),
            "config": {
                "min_detection_confidence": Config.MIN_DETECTION_CONFIDENCE,
                "letter_confirmation_delay": Config.LETTER_CONFIRMATION_DELAY
            },
            "message": "Model file not found - prediction will not work" if not is_healthy else "All services ready"
        }), 200  # Always return 200, even if unhealthy
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/labels', methods=['GET'])
def get_labels():
    """Get label dictionary endpoint"""
    try:
        if predictor is None:
            return jsonify({
                "success": False,
                "error": "Predictor not initialized"
            }), 503
        
        return jsonify({
            "success": True,
            "labels": predictor.get_labels()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
# Rate limiting kaldırıldı - frontend throttling yeterli
def predict():
    """Main prediction endpoint"""
    start_time = time.time()
    session_id = request.headers.get('X-Session-ID', 'unknown')
    
    try:
        # Check if services are initialized
        if hand_detector is None or predictor is None:
            response_time = time.time() - start_time
            update_global_state(session_id, False, response_time)
            return jsonify({
                "success": False,
                "error": "Services not initialized",
                "hand_detected": False,
                "prediction": {
                    "letter": None,
                    "confidence": 0.0,
                    "label_index": None
                },
                "timestamp": datetime.now().isoformat()
            }), 503
        
        # Get request data
        data = request.get_json()
        
        if not data or 'frame' not in data:
            return jsonify({
                "success": False,
                "error": "Frame data missing in request",
                "hand_detected": False,
                "prediction": {
                    "letter": None,
                    "confidence": 0.0,
                    "label_index": None
                },
                "timestamp": datetime.now().isoformat()
            }), 400
        
        # Smart cache with very short TTL (100ms) - only catches rapid duplicates
        # This prevents processing identical frames sent in quick succession
        cache_key = get_cache_key(data['frame'])
        cached_result = get_cached_prediction(cache_key)
        if cached_result:
            cached_result['cached'] = True
            response_time = time.time() - start_time
            update_global_state(session_id, True, response_time, cache_hit=True)
            return jsonify(cached_result), 200
        
        global request_counter
        request_counter += 1

        # Decode base64 image
        try:
            frame = decode_base64_image(data['frame'])
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": str(e),
                "hand_detected": False,
                "prediction": {
                    "letter": None,
                    "confidence": 0.0,
                    "label_index": None
                },
                "timestamp": datetime.now().isoformat()
            }), 400

        # Optional preprocessing (CLAHE on luminance) - varsayılan olarak kapalı
        if Config.ENABLE_PREPROCESSING:
            try:
                lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                cl = clahe.apply(l)
                limg = cv2.merge((cl, a, b))
                frame = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

                # Gamma correction for low light
                gamma = max(0.5, min(3.0, Config.PREPROCESS_GAMMA))
                invGamma = 1.0 / gamma
                table = np.array([((i / 255.0) ** invGamma) * 255
                    for i in np.arange(0, 256)]).astype("uint8")
                frame = cv2.LUT(frame, table)
            except Exception:
                pass

        # Detect hand (single pass - no flip fallback)
        detection_result = hand_detector.process_frame(frame)

        # Debug logs in development
        if Config.DEBUG:
            try:
                h_dbg, w_dbg = frame.shape[:2]
                print(f"🧪 Frame {w_dbg}x{h_dbg} | hand_detected={detection_result['hand_detected']}")
                # Brightness quick check (mean over grayscale)
                try:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    brightness = float(np.mean(gray))
                    print(f"   ↳ brightness≈{brightness:.1f}")
                except Exception:
                    pass
                # Save debug frames every N requests
                if Config.SAVE_DEBUG_FRAMES and request_counter % max(1, Config.DEBUG_FRAME_INTERVAL) == 0:
                    os.makedirs('debug_frames', exist_ok=True)
                    ts = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                    out_path = os.path.join('debug_frames', f'frame_{ts}_{w_dbg}x{h_dbg}.jpg')
                    cv2.imwrite(out_path, frame)
                    print(f"   ↳ saved debug frame: {out_path}")
            except Exception:
                pass
        
        # Initialize response
        response = {
            "success": True,
            "hand_detected": detection_result['hand_detected'],
            "prediction": {
                "letter": None,
                "confidence": 0.0,
                "label_index": None
            },
            "landmarks": None,
            "bounding_box": None,
            "timestamp": datetime.now().isoformat(),
            "error": None,
            "session_id": session_id
        }
        
        # If hand detected, make prediction
        if detection_result['hand_detected']:
            features = detection_result['features']
            prediction_result = predictor.predict(features)
            
            response['prediction'] = {
                "letter": prediction_result['letter'],
                "confidence": prediction_result['confidence'],
                "label_index": prediction_result['label_index']
            }
            
            # Add prediction to session history
            add_session_prediction(session_id, prediction_result)
            
            # Include landmarks (only x, y for frontend)
            if detection_result['landmarks']:
                response['landmarks'] = [
                    {'x': lm['x'], 'y': lm['y']} 
                    for lm in detection_result['landmarks']
                ]
            
            # Normalize bounding box coordinates (0..1) to avoid backend resize mismatch
            try:
                h_norm, w_norm = frame.shape[:2]
                bb = detection_result['bounding_box']
                response['bounding_box'] = {
                    'x1': max(0.0, min(1.0, bb['x1'] / float(w_norm))),
                    'y1': max(0.0, min(1.0, bb['y1'] / float(h_norm))),
                    'x2': max(0.0, min(1.0, bb['x2'] / float(w_norm))),
                    'y2': max(0.0, min(1.0, bb['y2'] / float(h_norm))),
                }
            except Exception:
                response['bounding_box'] = None
            
            if not prediction_result['success']:
                response['error'] = prediction_result['error']

        # Cache with short TTL for duplicate frame prevention
        set_cached_prediction(cache_key, response)
        
        # Update global state
        response_time = time.time() - start_time
        update_global_state(session_id, True, response_time, cache_hit=False)
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error in predict endpoint: {e}")
        traceback.print_exc()
        
        # Update global state for error
        response_time = time.time() - start_time
        update_global_state(session_id, False, response_time)
        
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "hand_detected": False,
            "prediction": {
                "letter": None,
                "confidence": 0.0,
                "label_index": None
            },
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/redis/info', methods=['GET'])
def get_redis_info():
    """Get Redis server information"""
    redis_info = redis_manager.get_redis_info()
    return jsonify(redis_info), 200

@app.route('/api/redis/sessions', methods=['GET'])
def get_redis_sessions():
    """Get all active sessions from Redis"""
    session_ids = redis_manager.get_all_sessions()
    return jsonify({
        "active_sessions": session_ids,
        "count": len(session_ids),
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/global-state', methods=['GET'])
def get_global_state_endpoint():
    """Get global state information"""
    return jsonify(get_global_state()), 200

@app.route('/api/session', methods=['GET'])
def get_session_info():
    """Get session information"""
    session_id = request.headers.get('X-Session-ID', 'unknown')
    client_ip = request.remote_addr or 'unknown'
    
    # Get session data
    session_data = get_session_data(session_id)
    
    return jsonify({
        "session_id": session_id,
        "client_ip": client_ip,
        "timestamp": datetime.now().isoformat(),
        "user_agent": request.headers.get('User-Agent', 'unknown'),
        "session_data": session_data
    }), 200

@app.route('/api/session/data', methods=['GET'])
def get_session_data_endpoint():
    """Get session data"""
    session_id = request.headers.get('X-Session-ID', 'unknown')
    
    if session_id == 'unknown':
        return jsonify({"error": "Session ID not provided"}), 400
    
    session_data = get_session_data(session_id)
    return jsonify(session_data), 200

@app.route('/api/session/data', methods=['POST'])
def update_session_data_endpoint():
    """Update session data"""
    session_id = request.headers.get('X-Session-ID', 'unknown')
    
    if session_id == 'unknown':
        return jsonify({"error": "Session ID not provided"}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    update_session_data(session_id, data)
    return jsonify({"success": True, "message": "Session data updated"}), 200

@app.route('/api/test', methods=['GET'])
def test():
    """Simple test endpoint"""
    return jsonify({
        "message": "Backend is running!",
        "timestamp": datetime.now().isoformat(),
        "cors_test": "CORS is working!"
    }), 200

@app.route('/', methods=['GET'])
def root():
    """Root endpoint for basic connectivity test"""
    return jsonify({
        "message": "Sign Language Backend API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle preflight OPTIONS requests for all API endpoints"""
    return '', 200

@app.route('/api/debug', methods=['GET'])
def debug():
    """Debug endpoint to check file system and model status"""
    debug_info = {
        "timestamp": datetime.now().isoformat(),
        "model_path": Config.MODEL_PATH,
        "model_exists": os.path.exists(Config.MODEL_PATH),
        "current_directory": os.getcwd(),
        "files_in_current_dir": os.listdir('.') if os.path.exists('.') else [],
        "models_dir_exists": os.path.exists('./models'),
        "files_in_models_dir": os.listdir('./models') if os.path.exists('./models') else [],
        "hand_detector_status": hand_detector is not None,
        "predictor_status": predictor is not None,
        "predictor_loaded": predictor.is_loaded() if predictor else False
    }
    
    return jsonify(debug_info), 200

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found",
        "timestamp": datetime.now().isoformat()
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({
        "success": False,
        "error": "Internal server error",
        "timestamp": datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting Sign Language Recognition Backend")
    print("=" * 60)
    
    # Hugging Face Spaces için port ayarı
    port = int(os.environ.get("PORT", 7860))
    
    # Initialize services
    if initialize_services():
        print("\n" + "=" * 60)
        print(f"✅ Server starting on http://0.0.0.0:{port}")
        print("=" * 60 + "\n")
        
        # Run the app
        app.run(
            debug=False,  # Production'da debug kapalı
            host="0.0.0.0",  # Hugging Face Spaces için gerekli
            port=port,
            threaded=True
        )
    else:
        print("\n" + "=" * 60)
        print("❌ Failed to start server - services initialization failed")
        print("=" * 60)
        # Hugging Face Spaces'te exit(1) yerine minimal server başlat
        print("🔄 Starting minimal server for debugging...")
        app.run(
            debug=False,
            host="0.0.0.0",
            port=port,
            threaded=True
        )