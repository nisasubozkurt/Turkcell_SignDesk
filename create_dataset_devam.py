import os
import cv2
import mediapipe as mp
import pickle

# Modeli yükle
model_dict = pickle.load(open('./model.p', 'rb'))
model = model_dict['model']

# Veri dizileri
data = []
labels = []

# Veri kümesi dizini
DATA_DIR = './data'

# Veri işleme
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

for dir_ in os.listdir(DATA_DIR):
    dir_path = os.path.join(DATA_DIR, dir_)
    if os.path.isdir(dir_path):  # Yalnızca dizinleri kontrol et
        for img_path in os.listdir(dir_path):
            img_full_path = os.path.join(dir_path, img_path)
            
            if os.path.isfile(img_full_path):  # Sadece dosyaları işle
                data_aux = []

                x_ = []
                y_ = []

                img = cv2.imread(img_full_path)
                if img is None:  # Eğer resim okunamazsa, geç
                    print(f"Resim okunamıyor: {img_full_path}")
                    continue
                    
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

                results = hands.process(img_rgb)
                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        for i in range(len(hand_landmarks.landmark)):
                            x = hand_landmarks.landmark[i].x
                            y = hand_landmarks.landmark[i].y

                            x_.append(x)
                            y_.append(y)

                        # Normalizasyon (min-max normalizasyonu)
                        min_x = min(x_)
                        min_y = min(y_)
                        for i in range(len(hand_landmarks.landmark)):
                            x = hand_landmarks.landmark[i].x
                            y = hand_landmarks.landmark[i].y
                            data_aux.append((x - min_x))  # Normalizasyon ekleniyor
                            data_aux.append((y - min_y))  # Normalizasyon ekleniyor

                    data.append(data_aux)
                    labels.append(dir_)

# Veriyi kaydet
with open('data.pickle', 'wb') as f:
    pickle.dump({'data': data, 'labels': labels}, f)

# Verinin uzunluğunu kontrol et
print(f"Data length: {len(data)}")
print(f"Labels length: {len(labels)}")

