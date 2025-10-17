// Timing Constants
export const LETTER_CONFIRMATION_DELAY = 1000; // 1 second in milliseconds
export const FRAME_CAPTURE_INTERVAL = 250; // ~30 FPS (1000/33 ≈ 30.3)
export const PREDICTION_COOLDOWN = 500; // Cooldown between predictions
export const STARTUP_COUNTDOWN = 3; // 3 seconds startup countdown
// How many consecutive frames without a hand before clearing pending letter
export const NO_HAND_CONSECUTIVE_FRAMES_TO_CLEAR = 3;

// Slideshow Constants (Text to Sign)
export const SLIDESHOW_DELAY = 2000; // 2 seconds per sign image
export const SLIDESHOW_TRANSITION_DURATION = 300; // Transition animation duration

// Camera Constants
export const CAMERA_WIDTH = 640;
export const CAMERA_HEIGHT = 480;
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 360;

// Confidence Threshold
export const CONFIDENCE_THRESHOLD = 0.5;
export const REQUIRED_CONSECUTIVE_FRAMES = 4; // ~1s at 250ms

// New Stable Letter Algorithm
export const STABLE_LETTER_FRAMES = 4; // OPTIMIZED: Reduced from 4 to 3 (faster response)
export const LETTER_STABILITY_THRESHOLD = 0.45; // Lowered per request
export const MIN_CONFIDENCE_FOR_UI = 0.15; // Lowered per request
export const HIGH_CONFIDENCE_THRESHOLD = 0.6; // High confidence gets faster processing

// Label Dictionary (A-Z)
export const LABELS_DICT: Record<number, string> = {
  0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
  6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K', 11: 'L',
  12: 'M', 13: 'N', 14: 'O', 15: 'P', 16: 'Q', 17: 'R',
  18: 'S', 19: 'T', 20: 'U', 21: 'V', 22: 'W', 23: 'X',
  24: 'Y', 25: 'Z'
};

// Sign Image Paths
export const SIGN_IMAGES_PATH = '/signs/';
export const SIGN_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg'];

// Text Input Limits
export const MAX_TEXT_INPUT_LENGTH = 500;
export const LONG_TEXT_WARNING_THRESHOLD = 50;

// Keyboard Keys
export const KEYBOARD_KEYS = {
  SPACE: ' ',
  BACKSPACE: 'Backspace',
  ENTER: 'Enter',
  C: 'c',
  Q: 'q',
} as const;

// UI Messages
export const UI_MESSAGES = {
  // Sign to Text Messages
  CAMERA_LOADING: 'Kamera hazırlanıyor...',
  CAMERA_ERROR: 'Kamera erişimi başarısız!',
  DETECTION_STARTED: 'Harf algılama başladı!',
  NO_HAND_DETECTED: 'El algılanmadı',
  WAITING_FOR_CONFIRMATION: 'Harfi sabit tutun...',
  LETTER_CONFIRMED: 'Harf onaylandı!',
  WORD_COMPLETED: 'Metin tamamlandı',
  BACKEND_ERROR: 'Backend bağlantı hatası!',

  // Text to Sign Messages
  TEXT_INPUT_PLACEHOLDER: 'Örnek: MERHABA DUNYA',
  TEXT_INPUT_EMPTY: 'Lütfen metin girin',
  TEXT_TOO_LONG: 'Metin çok uzun, daha kısa bir metin girin',
  CONVERTING_TO_SIGNS: 'İşaret diline çevriliyor...',
  CONVERSION_COMPLETE: 'Çevirme tamamlandı',
  IMAGE_NOT_FOUND: 'Resim bulunamadı',
  IMAGE_LOADING: 'Resim yükleniyor...',
} as const;
