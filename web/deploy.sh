#!/bin/bash

# SignDesk Production Deployment Script
# Bu script production sunucusunda çalıştırılır

set -e  # Exit on any error

echo "🚀 SignDesk Production Deployment Başlıyor..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/signdesk"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$PROJECT_DIR/venv"
SERVICE_USER="signdesk"
SERVICE_GROUP="signdesk"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Bu script root olarak çalıştırılmamalı!"
   exit 1
fi

# Check if user exists
if ! id "$SERVICE_USER" &>/dev/null; then
    print_error "Kullanıcı '$SERVICE_USER' bulunamadı!"
    exit 1
fi

print_status "Sistem güncellemeleri kontrol ediliyor..."
sudo apt update

print_status "Gerekli paketler kuruluyor..."
sudo apt install -y python3 python3-pip python3-venv nginx redis-server git

print_status "Redis servisi başlatılıyor..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

print_status "Redis bağlantısı test ediliyor..."
redis-cli ping || {
    print_error "Redis bağlantısı başarısız!"
    exit 1
}

print_status "Proje dizini oluşturuluyor..."
sudo mkdir -p $PROJECT_DIR
sudo chown $SERVICE_USER:$SERVICE_GROUP $PROJECT_DIR

print_status "Backend kurulumu..."
cd $BACKEND_DIR

# Virtual environment oluştur
if [ ! -d "$VENV_DIR" ]; then
    print_status "Virtual environment oluşturuluyor..."
    python3 -m venv $VENV_DIR
fi

# Virtual environment'ı aktif et
source $VENV_DIR/bin/activate

# Dependencies kur
print_status "Python dependencies kuruluyor..."
pip install --upgrade pip
pip install -r requirements.txt

# Environment dosyasını kopyala
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_status "Environment dosyası oluşturuluyor..."
    cp production.env .env
fi

print_status "Frontend kurulumu..."
cd $FRONTEND_DIR

# Node dependencies kur
if [ ! -d "node_modules" ]; then
    print_status "Node dependencies kuruluyor..."
    npm install
fi

# Frontend build
print_status "Frontend build ediliyor..."
npm run build

print_status "Nginx konfigürasyonu..."
sudo cp nginx.conf /etc/nginx/sites-available/signdesk
sudo ln -sf /etc/nginx/sites-available/signdesk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx test
sudo nginx -t || {
    print_error "Nginx konfigürasyon hatası!"
    exit 1
}

print_status "Gunicorn test ediliyor..."
cd $BACKEND_DIR
chmod +x test_gunicorn.sh
./test_gunicorn.sh || {
    print_error "Gunicorn test başarısız!"
    exit 1
}

print_status "Systemd service kurulumu..."
sudo cp $PROJECT_DIR/signdesk-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable signdesk-backend

print_status "Dosya izinleri ayarlanıyor..."
sudo chown -R $SERVICE_USER:$SERVICE_GROUP $PROJECT_DIR
sudo chmod +x $BACKEND_DIR/start_production.sh

print_status "Servisler başlatılıyor..."
sudo systemctl restart nginx
sudo systemctl restart signdesk-backend

print_status "Servis durumları kontrol ediliyor..."
sudo systemctl status nginx --no-pager -l
sudo systemctl status signdesk-backend --no-pager -l

print_status "✅ Deployment tamamlandı!"
print_status "🌐 Frontend: http://localhost"
print_status "🔧 Backend: http://localhost:5001"
print_status "📊 Redis: localhost:6379"

echo ""
print_status "Yararlı komutlar:"
echo "  sudo systemctl status signdesk-backend"
echo "  sudo systemctl restart signdesk-backend"
echo "  sudo systemctl logs signdesk-backend -f"
echo "  sudo systemctl status nginx"
echo "  redis-cli ping"
echo "  curl http://localhost:5001/api/health"
