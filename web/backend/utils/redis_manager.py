import redis
import json
import time
import logging
from typing import Optional, Dict, Any, List
from config import Config

logger = logging.getLogger(__name__)

class RedisManager:
    """Redis connection and session management"""
    
    def __init__(self):
        self.redis_client = None
        self.connection_pool = None
        self._connect()
    
    def _connect(self):
        """Establish Redis connection with fallback"""
        try:
            # Create connection pool
            self.connection_pool = redis.ConnectionPool(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                password=Config.REDIS_PASSWORD,
                max_connections=Config.REDIS_CONNECTION_POOL_SIZE,
                socket_timeout=Config.REDIS_SOCKET_TIMEOUT,
                socket_connect_timeout=Config.REDIS_SOCKET_CONNECT_TIMEOUT,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Create Redis client
            self.redis_client = redis.Redis(connection_pool=self.connection_pool)
            
            # Test connection
            self.redis_client.ping()
            logger.info("✅ Redis connected successfully")

        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            logger.info("🔄 Falling back to in-memory storage")
            self.redis_client = None
    
    def _ensure_connection(self):
        """Ensure Redis connection is active"""
        if not self.is_connected():
            self._connect()
        elif self.redis_client:
            try:
                self.redis_client.ping()
            except:
                logger.warning("🔄 Redis connection lost, reconnecting...")
                self._connect()
    
    def is_connected(self):
        """Check if Redis is connected"""
        try:
            if self.redis_client:
                self.redis_client.ping()
                return True
        except:
            pass
        return False
    
    def set_session_data(self, session_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set session data in Redis"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return False
            
            key = f"session:{session_id}"
            ttl = ttl or Config.REDIS_SESSION_TTL
            
            # Serialize data
            serialized_data = json.dumps(data, default=str)
            
            # Set with TTL
            result = self.redis_client.setex(key, ttl, serialized_data)
            return bool(result)
            
        except Exception as e:
            logger.error(f"❌ Redis set_session_data error: {e}")
            return False
    
    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data from Redis"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return None
            
            key = f"session:{session_id}"
            data = self.redis_client.get(key)
            
            if data:
                return json.loads(data)
            return None
            
        except Exception as e:
            logger.error(f"❌ Redis get_session_data error: {e}")
            return None
    
    def update_session_data(self, session_id: str, updates: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Update session data in Redis"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return False
            
            # Get existing data
            existing_data = self.get_session_data(session_id) or {}
            
            # Merge updates
            existing_data.update(updates)
            existing_data['last_activity'] = time.time()
            
            # Save back
            return self.set_session_data(session_id, existing_data, ttl)
            
        except Exception as e:
            logger.error(f"❌ Redis update_session_data error: {e}")
            return False
    
    def add_session_prediction(self, session_id: str, prediction: Dict[str, Any]) -> bool:
        """Add prediction to session history"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return False
            
            # Get existing data
            session_data = self.get_session_data(session_id) or {
                'created_at': time.time(),
                'last_activity': time.time(),
                'request_count': 0,
                'total_time': 0.0,
                'user_data': {},
                'predictions': [],
                'word_history': [],
                'settings': {
                    'confidence_threshold': 0.5,
                    'letter_delay': 3000,
                    'language': 'tr'
                }
            }
            
            # Add prediction
            session_data['predictions'].append({
                'prediction': prediction,
                'timestamp': time.time()
            })
            
            # Keep only last 50 predictions
            if len(session_data['predictions']) > 50:
                session_data['predictions'] = session_data['predictions'][-50:]
            
            session_data['last_activity'] = time.time()
            
            # Save back
            return self.set_session_data(session_id, session_data)
            
        except Exception as e:
            logger.error(f"❌ Redis add_session_prediction error: {e}")
            return False
    
    def add_session_word(self, session_id: str, word: str) -> bool:
        """Add word to session history"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return False
            
            # Get existing data
            session_data = self.get_session_data(session_id) or {
                'created_at': time.time(),
                'last_activity': time.time(),
                'request_count': 0,
                'total_time': 0.0,
                'user_data': {},
                'predictions': [],
                'word_history': [],
                'settings': {
                    'confidence_threshold': 0.5,
                    'letter_delay': 3000,
                    'language': 'tr'
                }
            }
            
            # Add word
            session_data['word_history'].append({
                'word': word,
                'timestamp': time.time()
            })
            
            # Keep only last 100 words
            if len(session_data['word_history']) > 100:
                session_data['word_history'] = session_data['word_history'][-100:]
            
            session_data['last_activity'] = time.time()
            
            # Save back
            return self.set_session_data(session_id, session_data)
            
        except Exception as e:
            logger.error(f"❌ Redis add_session_word error: {e}")
            return False
    
    def set_cache(self, key: str, data: Any, ttl: Optional[int] = None) -> bool:
        """Set cache data in Redis"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return False
            
            cache_key = f"cache:{key}"
            ttl = ttl or Config.REDIS_CACHE_TTL
            
            # Serialize data
            serialized_data = json.dumps(data, default=str)
            
            # Set with TTL
            result = self.redis_client.setex(cache_key, ttl, serialized_data)
            return bool(result)
            
        except Exception as e:
            logger.error(f"❌ Redis set_cache error: {e}")
            return False
    
    def get_cache(self, key: str) -> Optional[Any]:
        """Get cache data from Redis"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return None
            
            cache_key = f"cache:{key}"
            data = self.redis_client.get(cache_key)
            
            if data:
                return json.loads(data)
            return None
            
        except Exception as e:
            logger.error(f"❌ Redis get_cache error: {e}")
            return None
    
    def delete_session(self, session_id: str) -> bool:
        """Delete session from Redis"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return False
            
            key = f"session:{session_id}"
            result = self.redis_client.delete(key)
            return bool(result)
            
        except Exception as e:
            logger.error(f"❌ Redis delete_session error: {e}")
            return False
    
    def get_all_sessions(self) -> List[str]:
        """Get all active session IDs"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return []
            
            pattern = "session:*"
            keys = self.redis_client.keys(pattern)
            
            # Extract session IDs
            session_ids = []
            for key in keys:
                if isinstance(key, bytes):
                    key = key.decode('utf-8')
                session_id = key.replace('session:', '')
                session_ids.append(session_id)
            
            return session_ids
            
        except Exception as e:
            logger.error(f"❌ Redis get_all_sessions error: {e}")
            return []
    
    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions (Redis handles TTL automatically)"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return 0
            
            # Redis automatically handles TTL, but we can check for sessions
            # that might have been created before TTL was set
            session_ids = self.get_all_sessions()
            cleaned_count = 0
            
            for session_id in session_ids:
                session_data = self.get_session_data(session_id)
                if session_data:
                    # Check if session is older than 24 hours
                    if time.time() - session_data.get('last_activity', 0) > 86400:
                        self.delete_session(session_id)
                        cleaned_count += 1
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"❌ Redis cleanup_expired_sessions error: {e}")
            return 0
    
    def get_redis_info(self) -> Dict[str, Any]:
        """Get Redis server information"""
        try:
            self._ensure_connection()
            if not self.is_connected():
                return {"connected": False, "error": "Not connected"}
            
            info = self.redis_client.info()
            return {
                "connected": True,
                "version": info.get('redis_version'),
                "uptime": info.get('uptime_in_seconds'),
                "memory_used": info.get('used_memory_human'),
                "connected_clients": info.get('connected_clients'),
                "total_commands_processed": info.get('total_commands_processed')
            }
            
        except Exception as e:
            logger.error(f"❌ Redis get_redis_info error: {e}")
            return {"connected": False, "error": str(e)}
    
    def close(self):
        """Close Redis connection"""
        if self.redis_client:
            try:
                self.redis_client.close()
                logger.info("🔌 Redis connection closed")
            except Exception as e:
                logger.error(f"❌ Error closing Redis connection: {e}")

# Global Redis manager instance
redis_manager = RedisManager()
