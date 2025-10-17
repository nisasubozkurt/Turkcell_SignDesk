#!/bin/bash

# Model File Test Script
echo "🔍 Model File Test"
echo "=================="

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

# Test model paths
print_status "Model dosyası yolları kontrol ediliyor..."

model_paths=(
    "./models/combined_model.p"
    "/app/models/combined_model.p"
    "models/combined_model.p"
    "/opt/signdesk/backend/models/combined_model.p"
    "/opt/signdesk/models/combined_model.p"
)

found_model=false
for path in "${model_paths[@]}"; do
    if [ -f "$path" ]; then
        print_status "✅ Model bulundu: $path"
        print_status "   Boyut: $(ls -lh "$path" | awk '{print $5}')"
        print_status "   İzinler: $(ls -l "$path" | awk '{print $1}')"
        found_model=true
    else
        print_warning "⚠️ Model bulunamadı: $path"
    fi
done

if [ "$found_model" = false ]; then
    print_error "❌ Hiçbir model dosyası bulunamadı!"
    print_status "Mevcut dosyalar:"
    find . -name "*.p" -o -name "*.pkl" -o -name "*.model" 2>/dev/null | head -10
else
    print_status "✅ Model dosyası mevcut!"
fi

# Test Python model loading
print_status "Python model yükleme testi..."
python3 -c "
import os
import sys

model_paths = [
    './models/combined_model.p',
    '/app/models/combined_model.p',
    'models/combined_model.p',
    '/opt/signdesk/backend/models/combined_model.p',
    '/opt/signdesk/models/combined_model.p'
]

found = False
for path in model_paths:
    if os.path.exists(path):
        print(f'✅ Model bulundu: {path}')
        try:
            import pickle
            with open(path, 'rb') as f:
                model_dict = pickle.load(f)
            print(f'✅ Model başarıyla yüklendi: {type(model_dict)}')
            found = True
            break
        except Exception as e:
            print(f'❌ Model yükleme hatası: {e}')
    else:
        print(f'⚠️ Model bulunamadı: {path}')

if not found:
    print('❌ Hiçbir model dosyası yüklenemedi!')
    sys.exit(1)
else:
    print('✅ Model test başarılı!')
"
