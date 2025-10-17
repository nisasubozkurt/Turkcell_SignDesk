# Gunicorn Configuration for Sign Language Backend
# Bu dosya performans optimizasyonu için Gunicorn ayarlarını içerir

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5001')}"
backlog = 2048

# Worker processes - Gevent sorunları için geçici sync
workers = 8  # sync worker için daha fazla worker
worker_class = "sync"  # Geçici olarak sync (gevent yerine)
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'signdesk_backend'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'
user = None
group = None
tmp_upload_dir = None

# SSL (production için)
# keyfile = None
# certfile = None

# Performance tuning
preload_app = False  # Her worker kendi servisleri başlatsın
# worker_tmp_dir = "/dev/shm"  # RAM disk kullan (Linux) - Windows'ta çalışmaz

# Graceful timeout
graceful_timeout = 30

# Environment variables
raw_env = [
    'FLASK_ENV=production',
    'PYTHONPATH=/opt/signdesk/backend',
]

def when_ready(server):
    """Server hazır olduğunda çalışır"""
    server.log.info("🚀 Sign Language Backend server is ready!")

def worker_int(worker):
    """Worker kesintiye uğradığında çalışır"""
    worker.log.info("⚠️ Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Worker fork edilmeden önce çalışır"""
    server.log.info(f"🔄 Worker spawned (pid: {worker.pid})")

def post_fork(server, worker):
    """Worker fork edildikten sonra çalışır - servisleri başlat"""
    server.log.info(f"⚙️ Initializing services for worker (pid: {worker.pid})")
    
    # Import app ve servisleri başlat
    try:
        from app import initialize_services
        if initialize_services():
            server.log.info(f"✅ Worker ready with services loaded (pid: {worker.pid})")
        else:
            server.log.error(f"❌ Worker started but services failed to load (pid: {worker.pid})")
    except Exception as e:
        server.log.error(f"❌ Failed to initialize services: {e}")

def worker_abort(worker):
    """Worker anormal şekilde sonlandığında çalışır"""
    worker.log.info(f"❌ Worker aborted (pid: {worker.pid})")
