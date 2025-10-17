# Hugging Face Spaces için ana giriş dosyası
# Bu dosya Hugging Face Spaces'in otomatik olarak tanıması için gerekli

import os
import sys

# Mevcut app.py dosyasını import et
from app import app

if __name__ == "__main__":
    # Hugging Face Spaces için port ayarı
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)
