import os
import cv2
import mediapipe as mp
import matplotlib.pyplot as plt

# Mediapipe çözümleri
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Hand modelini başlatıyoruz
hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

DATA_DIR = './data'

# DATA_DIR'deki her klasörü gez
for dir_ in os.listdir(DATA_DIR):
    dir_path = os.path.join(DATA_DIR, dir_)
    if os.path.isdir(dir_path):  # sadece dizinleri kontrol et
        # Bu klasördeki her bir resmi işle
        for img_path in os.listdir(dir_path):
            img_full_path = os.path.join(dir_path, img_path)
            
            if os.path.isfile(img_full_path):
                img = cv2.imread(img_full_path)
                
                if img is None:  # Eğer resim okunamazsa, geç
                    print(f"Resim okunamıyor: {img_full_path}")
                    continue
                
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # OpenCV BGR -> RGB dönüşümü

                # El işaretlerini tespit et
                results = hands.process(img_rgb)

                if results.multi_hand_landmarks:
                    # Her eldeki işaretleri çiz
                    for hand_landmarks in results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(
                            img_rgb,
                            hand_landmarks,
                            mp_hands.HAND_CONNECTIONS,
                            mp_drawing_styles.get_default_hand_landmarks_style(),
                            mp_drawing_styles.get_default_hand_connections_style())

                # Sonuçları matplotlib ile göster
                plt.figure()
                plt.imshow(img_rgb)
                plt.title(f'Class: {dir_}, Image: {img_path}')
                plt.axis('off')  # Eksenleri gizle

plt.show()

