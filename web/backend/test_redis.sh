#!/bin/bash

# Redis Connection Test Script
echo "🔍 Redis Connection Test"
echo "======================="

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

# Test Redis server
print_status "Redis server durumu kontrol ediliyor..."
if systemctl is-active --quiet redis-server; then
    print_status "✅ Redis server çalışıyor"
else
    print_warning "⚠️ Redis server çalışmıyor, başlatılıyor..."
    sudo systemctl start redis-server
    sleep 2
    if systemctl is-active --quiet redis-server; then
        print_status "✅ Redis server başlatıldı"
    else
        print_error "❌ Redis server başlatılamadı"
        exit 1
    fi
fi

# Test Redis connection
print_status "Redis bağlantısı test ediliyor..."
if redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis bağlantısı başarılı"
else
    print_error "❌ Redis bağlantısı başarısız"
    exit 1
fi

# Test Redis port
print_status "Redis port kontrol ediliyor..."
if command -v netstat >/dev/null 2>&1; then
    if netstat -tlnp | grep -q ":6379 "; then
        print_status "✅ Redis port 6379 açık"
    else
        print_error "❌ Redis port 6379 kapalı"
        exit 1
    fi
else
    # Windows PowerShell için alternatif
    if powershell -Command "Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue" >/dev/null 2>&1; then
        print_status "✅ Redis port 6379 açık (PowerShell)"
    else
        print_warning "⚠️ Port kontrolü atlandı (netstat bulunamadı)"
    fi
fi

# Test Python Redis connection
print_status "Python Redis bağlantısı test ediliyor..."
python3 -c "
import redis
try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.ping()
    print('✅ Python Redis bağlantısı başarılı')
except Exception as e:
    print(f'❌ Python Redis bağlantısı başarısız: {e}')
    exit(1)
"

print_status "✅ Tüm Redis testleri başarılı!"
print_status "Backend service'i yeniden başlatılabilir:"
echo "sudo systemctl restart signdesk-backend"
