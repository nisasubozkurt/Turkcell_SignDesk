#!/bin/bash

# Gunicorn Test Script
# Bu script gunicorn'un doğru çalışıp çalışmadığını test eder

echo "🔍 Gunicorn Test Script"
echo "======================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    print_error "app.py bulunamadı! Backend dizininde çalıştırın."
    exit 1
fi

if [ ! -f "gunicorn.config.py" ]; then
    print_error "gunicorn.config.py bulunamadı!"
    exit 1
fi

# Check Python environment
print_status "Python environment kontrol ediliyor..."
python3 --version
which python3

# Check if virtual environment exists
if [ -d "../venv" ]; then
    print_status "Virtual environment bulundu, aktif ediliyor..."
    source ../venv/bin/activate
else
    print_warning "Virtual environment bulunamadı, sistem Python kullanılıyor..."
fi

# Check dependencies
print_status "Dependencies kontrol ediliyor..."
python3 -c "import flask, gunicorn, redis; print('✅ Tüm dependencies mevcut')" || {
    print_error "Dependencies eksik! pip install -r requirements.txt çalıştırın."
    exit 1
}

# Test gunicorn config
print_status "Gunicorn config test ediliyor..."
python3 -c "
import gunicorn.conf
import os
os.environ['PORT'] = '5001'
exec(open('gunicorn.config.py').read())
print('✅ Gunicorn config geçerli')
" || {
    print_error "Gunicorn config hatası!"
    exit 1
}

# Test Flask app
print_status "Flask app test ediliyor..."
python3 -c "
import sys
sys.path.append('.')
from app import app
print('✅ Flask app yüklendi')
" || {
    print_error "Flask app hatası!"
    exit 1
}

# Test Redis connection
print_status "Redis bağlantısı test ediliyor..."
python3 -c "
try:
    from utils.redis_manager import redis_manager
    if redis_manager.is_connected():
        print('✅ Redis bağlantısı başarılı')
    else:
        print('⚠️ Redis bağlantısı başarısız (fallback mode)')
except Exception as e:
    print('⚠️ Redis test hatası (fallback mode kullanılacak):', str(e))
" || {
    print_warning "Redis test hatası (fallback mode kullanılacak)"
}

print_status "✅ Tüm testler başarılı!"
print_status "Gunicorn başlatılabilir:"
echo "gunicorn --config gunicorn.config.py app:app"
