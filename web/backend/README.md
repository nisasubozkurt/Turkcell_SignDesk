# SignDesk Backend API

Bu API, işaret dili tanıma için geliştirilmiş bir Flask backend servisidir. MediaPipe ve makine öğrenmesi modelleri kullanarak gerçek zamanlı işaret dili harflerini (A-Z) tanır.

## 🚀 Production Deployment

### Hızlı Kurulum
```bash
# Deployment script'i çalıştır
chmod +x deploy.sh
./deploy.sh
```

### Manuel Kurulum
```bash
# 1. Redis kurulumu
sudo apt install redis-server
sudo systemctl start redis-server

# 2. Backend kurulumu
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp production.env .env

# 3. Frontend kurulumu
cd ../frontend
npm install
npm run build

# 4. Service kurulumu
sudo cp ../signdesk-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable signdesk-backend
sudo systemctl start signdesk-backend
```

## Özellikler

- 🤟 **Gerçek Zamanlı Tanıma**: Webcam üzerinden canlı işaret dili tanıma
- 📱 **Web Uyumlu**: Modern web tarayıcıları ile uyumlu
- 🎯 **Yüksek Doğruluk**: MediaPipe ve LightGBM tabanlı model
- 🔧 **Kolay Entegrasyon**: RESTful API endpoints
- 📊 **Detaylı Yanıtlar**: Güven skorları ve landmark verileri

## API Endpoints

### Health Check
```
GET /api/health
```
Servis durumunu kontrol eder.

### Prediction
```
POST /api/predict
```
Base64 kodlanmış görüntü verisi ile işaret dili harfi tahmini yapar.

**Request Body:**
```json
{
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "hand_detected": true,
  "prediction": {
    "letter": "A",
    "confidence": 0.95,
    "label_index": 0
  },
  "landmarks": [...],
  "bounding_box": {...},
  "timestamp": "2024-01-01T12:00:00"
}
```

### Labels
```
GET /api/labels
```
Desteklenen harf etiketlerini döndürür.

### Test
```
GET /api/test
```
Basit test endpoint'i.

## Teknik Detaylar

- **Framework**: Flask + Gunicorn
- **Computer Vision**: MediaPipe, OpenCV
- **ML Model**: LightGBM
- **Session Management**: Redis + In-Memory Fallback
- **Caching**: Redis + In-Memory Fallback
- **Image Processing**: CLAHE, Gamma Correction
- **CORS**: Cross-origin resource sharing desteği
- **Production**: Systemd service, Nginx proxy

## Model Bilgileri

- **Desteklenen Harfler**: A-Z (26 harf)
- **Girdi Formatı**: RGB görüntü
- **Çıktı**: Harf tahmini + güven skoru
- **Landmark Sayısı**: 21 nokta (MediaPipe Hand)

## 🔧 Geliştirme

### Yerel Çalıştırma

```bash
# Redis başlat
redis-server

# Backend başlat
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp production.env .env
python app.py

# Frontend başlat (başka terminal)
cd frontend
npm install
npm run dev
```

### Production Servisleri

```bash
# Backend servisi
sudo systemctl status signdesk-backend
sudo systemctl restart signdesk-backend
sudo journalctl -u signdesk-backend -f

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# Redis
sudo systemctl status redis-server
redis-cli ping
```

## 🔧 Troubleshooting

### Gunicorn Service Hatası
```bash
# Service durumunu kontrol et
sudo systemctl status signdesk-backend

# Detaylı logları görüntüle
sudo journalctl -u signdesk-backend -f

# Gunicorn config test et
cd backend
chmod +x test_gunicorn.sh
./test_gunicorn.sh

# Manuel gunicorn test
gunicorn --config gunicorn.config.py app:app
```

### Yaygın Hatalar

#### 1. `gunicorn_config.py` Bulunamadı
```bash
# Çözüm: Dosya adını kontrol et
ls -la gunicorn.config.py
```

#### 2. Redis Bağlantı Hatası
```bash
# Redis servisini başlat
sudo systemctl start redis-server
redis-cli ping
```

#### 3. Port Çakışması
```bash
# Port kullanımını kontrol et
sudo netstat -tlnp | grep 5001
sudo lsof -i :5001
```

## Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## İletişim

Sorularınız için issue açabilir veya iletişime geçebilirsiniz.