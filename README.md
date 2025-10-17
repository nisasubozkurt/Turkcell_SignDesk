# 🤟 Turkcell SignDesk - İşaret Dili Uygulaması

**İşitme engelli bireylerin iletişimini kolaylaştırmak için geliştirilmiş, gerçek zamanlı işaret dili tanıma ve çeviri uygulaması.**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Sistem Mimarisi](#-sistem-mimarisi)
- [Kurulum](#-kurulum)
  - [Gereksinimler](#gereksinimler)
  - [Geliştirme Ortamı](#geliştirme-ortamı)
- [Kullanım](#-kullanım)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Performans Optimizasyonları](#-performans-optimizasyonları)
- [İletişim](#-iletişim)

---

## 🎯 Genel Bakış

**Turkcell SignDesk**, işitme engelli bireylerin günlük yaşamlarını kolaylaştırmak amacıyla geliştirilmiş, yapay zeka destekli bir işaret dili tanıma ve çeviri platformudur. Uygulama, web kamerası aracılığıyla gerçek zamanlı işaret dili hareketlerini tanır ve metne dönüştürür, ayrıca metinden işaret diline çeviri yapabilir.

### Proje Hedefleri

- ✨ **Erişilebilirlik**: İşitme engelli bireylerin iletişim engellerini azaltmak
- 🚀 **Gerçek Zamanlı**: Anlık işaret dili tanıma ve çeviri
- 🎯 **Yüksek Doğruluk**: MediaPipe ve LightGBM ile %90+ doğruluk oranı
- 💻 **Web Tabanlı**: Platform bağımsız, tarayıcı üzerinden çalışma
- 🔄 **İki Yönlü**: İşaret dili ↔ Metin çevirisi

### Geliştirici Ekibi

- **Nisasu Bozkurt**
- **Rukiye Uçar** 
- **Özge Solmaz** 


## ✨ Özellikler

### 🤟 İşaret Dili → Metin (Sign-to-Text)

- **Gerçek Zamanlı Tanıma**: Webcam üzerinden anlık işaret dili harfi tanıma (A-Z)
- **Akıllı Stabilizasyon**: Hatalı tanımaları önlemek için çoklu frame doğrulama
- **Güven Skoru Gösterimi**: Her tahmin için güvenilirlik yüzdesi
- **El Algılama**: MediaPipe ile 21 noktalı el landmark tespiti
- **Otomatik Kelime Oluşturma**: Tanınan harflerden kelime birleştirme
- **Geri Sayım Göstergesi**: Harf onaylanmadan önce görsel geri sayım
- **Adaptif İşleme**: Sistem performansına göre otomatik hız ayarlama

### 📝 Metin → İşaret Dili (Text-to-Sign)

- **Metin Girişi**: Klavyeden metin yazma
- **Animasyonlu Gösterim**: Her harf için işaret dili görselleri
- **Hız Kontrolü**: Gösterim hızını ayarlama
- **Kelime Yönetimi**: Cümleleri kelime kelime gösterme

### 🎨 Kullanıcı Arayüzü

- **Modern Tasarım**: Tailwind CSS ile responsive ve şık arayüz
- **Koyu/Açık Tema**: Otomatik tema desteği
- **Mobil Uyumlu**: Tüm cihazlarda sorunsuz çalışma
- **Klavye Kısayolları**: Hızlı işlem için tuş kombinasyonları
  - `Space`: Boşluk ekle
  - `Backspace`: Son karakteri sil
  - `Delete`: Tümünü temizle
  - `Enter`: Kelimeyi tamamla

### 🔧 Teknik Özellikler

- **Session Yönetimi**: Redis tabanlı oturum takibi
- **Cache Sistemi**: Redis + In-Memory dual-layer caching
- **Rate Limiting**: API aşırı kullanımını önleme
- **Request Throttling**: Sunucu yükünü dengeleme
- **Health Monitoring**: Servis sağlığı kontrolü
- **Debug Modu**: Geliştirme için detaylı log kayıtları
- **CORS Desteği**: Cross-origin istekleri için tam destek

---

## 📸 Ekran Görüntüleri

> **Not**: Aşağıdaki bölüme ekran görüntülerini ekleyebilirsiniz.

<img width="1366" height="852" alt="image-9" src="https://github.com/user-attachments/assets/2902aa61-c94b-41a7-8792-63c6cf977935" />

### Ana Ekran - İşaret Dili Tanıma

<img width="1366" height="514" alt="image-10" src="https://github.com/user-attachments/assets/382d3a56-1c7c-459e-8d1f-f78ca7701820" />
<img width="1366" height="514" alt="image-11" src="https://github.com/user-attachments/assets/7cb2bae8-11f2-450d-a1f3-970d8f6e1a67" />
<img width="1366" height="514" alt="image-12" src="https://github.com/user-attachments/assets/0ea25f3f-93e1-458a-94d8-5bb36a0002ae" />

```
- Webcam görüntüsü
- El algılama gösterimi
- Tanınan harf ve güven skoru
- Oluşturulan kelime
```

### Metin → İşaret Dili Modu
<img width="1366" height="514" alt="image-13" src="https://github.com/user-attachments/assets/caae5060-a091-44e6-9741-4e4651a88dd6" />
<img width="1366" height="514" alt="image-14" src="https://github.com/user-attachments/assets/3a810714-253d-4301-8638-78f7a55221ed" />
<img width="1366" height="514" alt="image" src="https://github.com/user-attachments/assets/332082ba-f408-4a87-805b-841d59e88628" />
<img width="1366" height="514" alt="image-15" src="https://github.com/user-attachments/assets/cbf09d88-cde5-451a-9e48-edc7d87ea3dd" />


```
- Metin giriş alanı
- İşaret dili animasyonları
- Hız kontrolü
```

---

## 🛠 Teknoloji Yığını

### Backend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Python** | 3.8+ | Ana programlama dili |
| **Flask** | 3.0.0 | Web framework |
| **MediaPipe** | 0.10.8 | El tespiti ve landmark çıkarımı |
| **LightGBM** | 4.6.0 | Makine öğrenmesi modeli |
| **OpenCV** | 4.8.1.78 | Görüntü işleme |
| **Redis** | 5.0.1 | Session ve cache yönetimi |
| **Gunicorn** | 21.2.0 | Production WSGI server |
| **NumPy** | 1.24.3 | Sayısal hesaplamalar |
| **Scikit-learn** | 1.2.0 | ML utilities |

### Frontend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **React** | 19.1.1 | UI framework |
| **TypeScript** | 5.9.3 | Tip güvenli JavaScript |
| **Vite** | 7.1.7 | Build tool ve dev server |
| **Tailwind CSS** | 3.4.18 | Styling framework |
| **Axios** | 1.12.2 | HTTP client |
| **Lucide React** | 0.544.0 | Icon library |
| **Headless UI** | 2.2.0 | Accessible UI components |

### DevOps & Infrastructure

- **Nginx**: Reverse proxy ve static file serving
- **Systemd**: Service management
- **Git**: Version control
- **npm/pip**: Package management

---

## 🏗 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React Frontend (TypeScript + Vite)           │  │
│  │  - Webcam capture                                    │  │
│  │  - Real-time UI updates                              │  │
│  │  - State management (hooks)                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                     │
│  - Static file serving                                       │
│  - Load balancing                                            │
│  - SSL/TLS termination                                       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Flask + Gunicorn)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Flask Application                       │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  API Endpoints                                 │ │  │
│  │  │  - /api/predict (POST)                         │ │  │
│  │  │  - /api/health (GET)                           │ │  │
│  │  │  - /api/labels (GET)                           │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Core Services                                 │ │  │
│  │  │  - HandDetector (MediaPipe)                    │ │  │
│  │  │  - SignLanguagePredictor (LightGBM)            │ │  │
│  │  │  - RedisManager (Session/Cache)                │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    REDIS (In-Memory DB)                      │
│  - Session storage                                           │
│  - Prediction caching                                        │
│  - Rate limiting                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ML MODEL (LightGBM)                       │
│  - Trained on 26 sign language letters (A-Z)                │
│  - Input: 63 features (21 landmarks × 3 coordinates)         │
│  - Output: Letter prediction + confidence score              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Capture**: Frontend webcam'den frame yakalar
2. **Encode**: Frame'i base64 formatına çevirir
3. **Send**: HTTP POST ile backend'e gönderir
4. **Decode**: Backend base64'ü OpenCV image'e çevirir
5. **Detect**: MediaPipe ile el ve landmark'ları tespit eder
6. **Extract**: 21 landmark × 3 koordinat = 63 feature
7. **Predict**: LightGBM modeli harf tahmini yapar
8. **Cache**: Sonuç Redis'e cache'lenir
9. **Return**: JSON response frontend'e döner
10. **Display**: React UI'da sonuç gösterilir

---

## 🚀 Kurulum

### Gereksinimler

#### Sistem Gereksinimleri

- **OS**: Linux (Ubuntu 20.04+), Windows 10+, macOS 10.15+
- **RAM**: Minimum 4GB (8GB+ önerilir)
- **CPU**: 2+ cores (4+ önerilir)
- **Webcam**: Minimum 720p çözünürlük
- **İnternet**: İlk kurulum için gerekli

#### Yazılım Gereksinimleri

- **Python**: 3.8 veya üstü
- **Node.js**: 18.0 veya üstü
- **npm**: 9.0 veya üstü
- **Redis**: 5.0 veya üstü (production için)
- **Git**: Version control için

---

### Geliştirme Ortamı

#### 1. Repository'yi Klonlayın

```bash
git clone <repository-url>
cd web
```

#### 2. Backend Kurulumu

```bash
# Backend dizinine geçin
cd backend

# Virtual environment oluşturun (önerilir)
python3 -m venv venv

# Virtual environment'ı aktif edin
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install --upgrade pip
pip install -r requirements.txt

# Environment dosyasını oluşturun
cp production.env .env

# .env dosyasını düzenleyin (gerekirse)
nano .env
```

#### 3. Redis Kurulumu (Opsiyonel - Development için)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test
redis-cli ping  # PONG dönmeli
```

**macOS:**
```bash
brew install redis
brew services start redis

# Test
redis-cli ping  # PONG dönmeli
```

**Windows:**
```bash
# WSL kullanın veya Redis for Windows indirin
# https://github.com/microsoftarchive/redis/releases
```

> **Not**: Redis kurulmazsa uygulama otomatik olarak in-memory fallback'e geçer.

#### 4. Frontend Kurulumu

```bash
# Frontend dizinine geçin (yeni terminal)
cd frontend

# Bağımlılıkları yükleyin
npm install

# Environment dosyasını oluşturun
cp production.env .env

# .env dosyasını düzenleyin (gerekirse)
# VITE_API_URL=http://localhost:5000
nano .env
```

#### 5. Uygulamayı Başlatın

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

Backend şu adreste çalışacak: `http://localhost:5001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend şu adreste çalışacak: `http://localhost:5173`

#### 6. Tarayıcıda Açın

```
http://localhost:5173
```

---

### Production Deployment

Production ortamında deployment için otomatik script sağlanmıştır.

#### Hızlı Production Kurulumu

```bash
# Deployment script'ini çalıştır
chmod +x deploy.sh
./deploy.sh
```

Script otomatik olarak:
- ✅ Sistem paketlerini günceller
- ✅ Python ve Node.js bağımlılıklarını kurar
- ✅ Redis'i kurar ve başlatır
- ✅ Virtual environment oluşturur
- ✅ Frontend'i build eder
- ✅ Nginx konfigürasyonunu ayarlar
- ✅ Systemd service'ini kurar
- ✅ Servisleri başlatır

#### Production Servis Yönetimi

```bash
# Backend servisi
sudo systemctl status signdesk-backend   # Durum kontrolü
sudo systemctl start signdesk-backend    # Başlat
sudo systemctl stop signdesk-backend     # Durdur
sudo systemctl restart signdesk-backend  # Yeniden başlat
sudo journalctl -u signdesk-backend -f   # Logları izle

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t  # Konfigürasyon test

# Redis
sudo systemctl status redis-server
redis-cli ping  # Bağlantı test
```

---

## 📖 Kullanım

### İşaret Dili → Metin Modu

1. **Başlat**: Uygulama açıldığında otomatik olarak "İşaret Dili → Metin" modunda başlar
2. **Kamera İzni**: Tarayıcı kamera izni isteyecektir, "İzin Ver"e tıklayın
3. **Geri Sayım**: 3 saniyelik hazırlık geri sayımı başlar
4. **İşaret Göster**: Elinizi kameraya gösterin ve işaret dili harfi yapın
5. **Tanıma**: Sistem harfi tanıyacak ve ekranda gösterecek
6. **Onay**: Aynı harfi yeterli süre gösterdiğinizde otomatik olarak kelimeye eklenecek
7. **Kelime Oluştur**: Harfleri birleştirerek kelimeler oluşturun

**Klavye Kısayolları:**
- `Space`: Boşluk ekle
- `Backspace`: Son harfi sil
- `Delete`: Tümünü temizle
- `Enter`: Kelimeyi tamamla ve metin-işaret moduna geç

### Metin → İşaret Dili Modu

1. **Mod Seç**: Üst menüden "Metin → İşaret Dili" modunu seçin
2. **Metin Gir**: Çevirmek istediğiniz metni yazın
3. **Başlat**: "Göster" butonuna tıklayın
4. **İzle**: Her harf için işaret dili görselleri sırayla gösterilecek
5. **Kontrol**: Hızı ayarlayabilir, duraklatabilir veya durdurabilirsiniz

---

## 🔌 API Dokümantasyonu

### Base URL

```
Production: https://signdesk.live/api
Development: http://localhost:5001/api
```

### Endpoints

#### 1. Health Check

Servis durumunu kontrol eder.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "mediapipe_ready": true,
  "timestamp": "2025-01-15T10:30:00",
  "config": {
    "min_detection_confidence": 0.18,
    "letter_confirmation_delay": 2.5
  },
  "message": "All services ready"
}
```

#### 2. Prediction

Base64 kodlanmış görüntüden işaret dili tahmini yapar.

**Endpoint:** `POST /api/predict`

**Headers:**
```
Content-Type: application/json
X-Session-ID: <unique-session-id>
```

**Request Body:**
```json
{
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (Success - Hand Detected):**
```json
{
  "success": true,
  "hand_detected": true,
  "prediction": {
    "letter": "A",
    "confidence": 0.95,
    "label_index": 0
  },
  "landmarks": [
    {"x": 0.5, "y": 0.3},
    ...
  ],
  "bounding_box": {
    "x1": 0.2,
    "y1": 0.1,
    "x2": 0.8,
    "y2": 0.9
  },
  "timestamp": "2025-01-15T10:30:00",
  "session_id": "abc123",
  "cached": false
}
```

**Response (No Hand):**
```json
{
  "success": true,
  "hand_detected": false,
  "prediction": {
    "letter": null,
    "confidence": 0.0,
    "label_index": null
  },
  "landmarks": null,
  "bounding_box": null,
  "timestamp": "2025-01-15T10:30:00"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Frame data missing in request",
  "hand_detected": false,
  "prediction": {
    "letter": null,
    "confidence": 0.0,
    "label_index": null
  },
  "timestamp": "2025-01-15T10:30:00"
}
```

#### 3. Get Labels

Desteklenen harf etiketlerini döndürür.

**Endpoint:** `GET /api/labels`

**Response:**
```json
{
  "success": true,
  "labels": {
    "0": "A",
    "1": "B",
    "2": "C",
    ...
    "25": "Z"
  }
}
```

#### 4. Global State

Sistem istatistiklerini döndürür.

**Endpoint:** `GET /api/global-state`

**Response:**
```json
{
  "total_requests": 1523,
  "successful_requests": 1498,
  "failed_requests": 25,
  "cache_hits": 342,
  "cache_misses": 1181,
  "cache_hit_rate": 22.45,
  "error_rate": 1.64,
  "average_response_time": 0.042,
  "active_sessions_count": 3,
  "timestamp": "2025-01-15T10:30:00"
}
```

#### 5. Redis Info

Redis sunucu bilgilerini döndürür.

**Endpoint:** `GET /api/redis/info`

**Response:**
```json
{
  "connected": true,
  "host": "localhost",
  "port": 6379,
  "db_size": 1234,
  "used_memory": "2.5M",
  "uptime_seconds": 86400
}
```

### Rate Limiting

API istekleri rate limiting ile korunmaktadır:

- **Per Session**: 600 requests/minute
- **Per IP**: 600 requests/minute
- **Global**: 1000 requests/minute

Rate limit aşıldığında:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please slow down your requests.",
  "retry_after": 60
}
```

HTTP Status Code: `429 Too Many Requests`

---

## ⚡ Performans Optimizasyonları

### Backend Optimizasyonları

1. **Dual-Layer Caching**
   - Redis (primary) + In-Memory (fallback)
   - 100ms TTL ile duplicate frame önleme
   - Cache hit rate: ~22-25%

2. **Request Throttling**
   - Session-based rate limiting
   - Request queue buildup prevention
   - Adaptive scheduling

3. **Image Processing**
   - CLAHE (Contrast Limited Adaptive Histogram Equalization)
   - Gamma correction (low light)
   - Configurable preprocessing

4. **Model Optimization**
   - LightGBM (hızlı inference)
   - Preloaded model (startup time)
   - Single hand tracking (performance)

5. **Concurrent Handling**
   - Gunicorn multi-worker
   - Thread-safe operations
   - Connection pooling

### Frontend Optimizasyonları

1. **Frame Capture**
   - Adaptive interval (33-250ms)
   - Request pending prevention
   - Smart scheduling

2. **State Management**
   - Efficient React hooks
   - Minimal re-renders
   - Ref-based operations

3. **UI Performance**
   - Tailwind CSS (minimal bundle)
   - Code splitting
   - Lazy loading

4. **Network**
   - Request throttling
   - Axios interceptors
   - Retry logic

### Benchmark Sonuçları

| Metrik | Değer |
|--------|-------|
| Average Response Time | 35-50ms |
| Frames per Second | 20-30 FPS |
| Cache Hit Rate | 22-25% |
| Model Inference | 15-25ms |
| End-to-End Latency | 80-120ms |
| Concurrent Users | 50+ |
| Memory Usage (Backend) | ~500MB |
| Memory Usage (Frontend) | ~150MB |

---


### Kod Standartları

**Python (Backend):**
- PEP 8 style guide
- Type hints kullanın
- Docstrings ekleyin

**TypeScript (Frontend):**
- ESLint rules
- Prettier formatting
- TypeScript strict mode

### Proje Ekibi

- **Nisasu Bozkurt**
  - GitHub: [@nisasu](https://github.com/nisasubozkurt)

- **Rukiye Uçar** 
  - GitHub: [@rukiye](https://github.com/ucarrukiye)

- **Özge Solmaz**
  - GitHub: [@ozge](https://github.com/ozgessolmaz)

### Destek
- 🌐 **Website**: https://signdesk.live

## 🙏 Teşekkürler

Bu projeyi mümkün kılan teknolojiler ve kütüphaneler:

- [MediaPipe](https://google.github.io/mediapipe/) - Google'ın el tespiti kütüphanesi
- [LightGBM](https://lightgbm.readthedocs.io/) - Microsoft'un gradient boosting framework'ü
- [Flask](https://flask.palletsprojects.com/) - Python web framework
- [React](https://reactjs.org/) - Facebook'un UI kütüphanesi
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Redis](https://redis.io/) - In-memory data store
- [OpenCV](https://opencv.org/) - Computer vision library

## 🗺️ Roadmap

### v1.0 (Mevcut) ✅
- ✅ Gerçek zamanlı işaret dili tanıma (A-Z)
- ✅ Metin → İşaret dili çevirisi
- ✅ Web tabanlı arayüz
- ✅ Redis cache sistemi
- ✅ Production deployment

### v1.1 (Planlanıyor) 🚧
- 🔲 Kelime tahmin sistemi (autocomplete)
- 🔲 Kullanıcı profilleri
- 🔲 Öğrenme modu (pratik yapma)
- 🔲 Çoklu dil desteği

### v2.0 (Gelecek) 🔮
- 🔲 Video → İşaret dili çevirisi
- 🔲 Tam cümle tanıma
- 🔲 Yüz ifadesi analizi
- 🔲 Ses → İşaret dili
- 🔲 WebRTC ile gerçek zamanlı görüşme
- 🔲 AR (Augmented Reality) desteği


<div align="center">

**Turkcell SignDesk ile iletişimin önündeki engelleri kaldırıyoruz! 🤟**

Made with ❤️ by Nisasu Bozkurt, Rukiye Uçar & Özge Solmaz

[⬆ Başa Dön](#-turkcell-signdesk---türk-işaret-dili-uygulaması)

</div>
