import sys
import os
import subprocess
import importlib

# Gerekli kütüphaneleri kontrol et ve yükle
required_packages = {
    "mediapipe": "mediapipe",
    "cv2": "opencv-python",
    "sklearn": "scikit-learn==1.2.0",
    "numpy": "numpy",
    "lightgbm": "lightgbm"
}


for pkg, install_name in required_packages.items():
    try:
        importlib.import_module(pkg)
    except ImportError:
        print(f"{pkg} yüklü değil, yükleniyor...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", install_name])


import pickle
import cv2
import mediapipe as mp
import numpy as np
import time
from threading import Timer

# Modeli yükleme
try:
    model_dict = pickle.load(open('./combined_model.p', 'rb'))
    model = model_dict['model']
except Exception as e:
    print("Model yüklenirken hata oluştu:", e)
    sys.exit(1)

cap = cv2.VideoCapture(1)

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

labels_dict = {i: chr(65+i) for i in range(26)}

# Harfleri tutmak için değişkenler
current_word = []
last_letter = None
letter_display_duration = 2.0
confidence_threshold = 0.7
last_prediction_time = 0
prediction_cooldown = 0.5

# Kamera açıldıktan sonra 3 saniye bekleme
camera_start_time = time.time()
countdown_duration = 3.0
detection_started = False

# Harf bekleme
letter_confirmation_delay = 3.0
current_letter_start_time = None
pending_letter = None
letter_confirmed = False
word_formation_active = True

print("Kamera açılıyor... 3 saniye sonra harf algılama başlayacak.")
print("Her harf için 3 saniye bekleyin, ENTER ile kelimeyi tamamlayın.")

while True:
    data_aux = []
    x_ = []
    y_ = []

    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame, exiting...")
        break

    frame = cv2.flip(frame, 1)
    H, W, _ = frame.shape
    current_time = time.time()

    # 3 saniyelik hazırlık countdown
    if not detection_started:
        elapsed_time = current_time - camera_start_time
        remaining_time = countdown_duration - elapsed_time
        if remaining_time > 0:
            countdown_text = f"Baslamaya: {int(remaining_time) + 1}"
            (text_width, text_height), _ = cv2.getTextSize(countdown_text, cv2.FONT_HERSHEY_SIMPLEX, 2.0, 4)
            text_x = (W - text_width) // 2
            text_y = H // 2
            cv2.rectangle(frame, (text_x-40, text_y-text_height-20), (text_x+text_width+40, text_y+20), (255,255,255), -1)
            cv2.rectangle(frame, (text_x-40, text_y-text_height-20), (text_x+text_width+40, text_y+20), (0,0,0), 3)
            cv2.putText(frame, countdown_text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (0,0,0), 4)
            info_text = "Kamera hazirlaniyor..."
            (info_width, _), _ = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)
            info_x = (W - info_width) // 2
            cv2.putText(frame, info_text, (info_x, H-100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,255), 2)
            cv2.imshow('frame', frame)
            cv2.waitKey(1)
            continue
        else:
            detection_started = True
            print("Harf algılama başladı! El işaretlerinizi gösterin.")

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                                      mp_drawing_styles.get_default_hand_landmarks_style(),
                                      mp_drawing_styles.get_default_hand_connections_style())

        for hand_landmarks in results.multi_hand_landmarks:
            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                x_.append(x)
                y_.append(y)

            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                data_aux.append(x - min(x_))
                data_aux.append(y - min(y_))

        if len(data_aux) > 42:
            data_aux = data_aux[:42]

        x1 = int(min(x_) * W) - 10
        y1 = int(min(y_) * H) - 10
        x2 = int(max(x_) * W) - 10
        y2 = int(max(y_) * H) - 10

        if current_time - last_prediction_time > prediction_cooldown and word_formation_active:
            prediction = model.predict([np.asarray(data_aux)])
            predicted_character = labels_dict[int(prediction[0])]

            if predicted_character != pending_letter:
                pending_letter = predicted_character
                current_letter_start_time = current_time
                letter_confirmed = False
                last_prediction_time = current_time
                print(f"Yeni harf algılandı: {predicted_character} - 3 saniye bekleniyor...")
            elif pending_letter and current_letter_start_time and not letter_confirmed:
                if current_time - current_letter_start_time >= letter_confirmation_delay:
                    current_word.append(pending_letter)
                    last_letter = pending_letter
                    letter_confirmed = True
                    print(f"Harf onaylandı ve kelimeye eklendi: {pending_letter}")
                    print(f"Güncel kelime: {''.join(current_word)}")
                    pending_letter = None
                    current_letter_start_time = None

        if pending_letter and not letter_confirmed:
            elapsed_letter_time = current_time - current_letter_start_time if current_letter_start_time else 0
            remaining_letter_time = letter_confirmation_delay - elapsed_letter_time
            if remaining_letter_time > 0:
                countdown_text = f"Harf: {pending_letter} - Onaylanmaya: {int(remaining_letter_time) + 1}s"
                (text_width, text_height), _ = cv2.getTextSize(countdown_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)
                text_x = (W - text_width) // 2
                text_y = H // 2 + 100
                cv2.rectangle(frame, (text_x-20, text_y-text_height-10), (text_x+text_width+20, text_y+10), (0,255,0), -1)
                cv2.rectangle(frame, (text_x-20, text_y-text_height-10), (text_x+text_width+20, text_y+10), (0,0,0), 2)
                cv2.putText(frame, countdown_text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,0), 3)
                progress_width = 300
                progress_height = 20
                progress_x = (W - progress_width) // 2
                progress_y = text_y + 30
                cv2.rectangle(frame, (progress_x, progress_y), (progress_x+progress_width, progress_y+progress_height), (200,200,200), -1)
                progress_fill = int((elapsed_letter_time / letter_confirmation_delay) * progress_width)
                cv2.rectangle(frame, (progress_x, progress_y), (progress_x+progress_fill, progress_y+progress_height), (0,255,0), -1)
                cv2.rectangle(frame, (progress_x, progress_y), (progress_x+progress_width, progress_y+progress_height), (0,0,0), 2)

        cv2.rectangle(frame, (x1,y1), (x2,y2), (0,0,0), 4)
        cv2.putText(frame, last_letter if last_letter else "?", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0,0,0), 3, cv2.LINE_AA)

    # Ekranda kelimeyi göster
    if current_word and word_formation_active:
        word_text = "".join(current_word)
        (word_width, word_height), _ = cv2.getTextSize(f"Metin: {word_text}", cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)
        box_x1 = (W - word_width - 40) // 2
        box_x2 = (W + word_width + 40) // 2
        box_y1 = H - 140
        box_y2 = H - 30
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (255,255,255), -1)
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0,0,0), 3)
        word_x = (W - word_width) // 2
        cv2.putText(frame, f"Metin: {word_text}", (word_x, H-80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,0), 3)

    cv2.putText(frame, "Q: Cikis, SPACE: Bosluk Ekle, C: Metni Temizle, BACKSPACE: Son Harfi Sil, ENTER: Metni Tamamla", (10, H-20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0,0,255), 2)
    cv2.imshow('frame', frame)

    key = cv2.waitKey(1)
    if key != -1:
        key = key & 0xFF
        if key == ord('q') or key == ord('Q') or key == 27:
            break
        elif key == ord('c') or key == ord('C'):
            current_word.clear()
            last_letter = None
            pending_letter = None
            current_letter_start_time = None
            letter_confirmed = False
            word_formation_active = True
        elif key == 32:
            if current_word:
                current_word.append(" ")
                last_letter = " "
                word_formation_active = True
                pending_letter = None
                current_letter_start_time = None
                letter_confirmed = False
        elif key in [8, 127]:
            if current_word:
                current_word.pop()
                last_letter = current_word[-1] if current_word else None
                pending_letter = None
                current_letter_start_time = None
                letter_confirmed = False
                word_formation_active = True
        elif key == 13:  # ENTER tuşu - kelimeyi tamamla
            if current_word:
                word_formation_active = False
                final_word = ''.join(current_word)
                print(f"Kelime tamamlandı: {final_word}")
                print("Yeni harf tanıma durduruldu. Yeni kelime için SPACE tuşuna basın.")

        # 10 saniye kelimeyi ekranda göster
                start_time = time.time()
                while time.time() - start_time < 3:
                    temp_frame = frame.copy()
                    message_text = f"Kelime Tamamlandi: {final_word}"
                    (msg_width, msg_height), _ = cv2.getTextSize(message_text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)
                    msg_x = (W - msg_width) // 2
                    msg_y = H // 2

                    cv2.rectangle(temp_frame, (msg_x-20, msg_y-40), (msg_x+msg_width+20, msg_y+20), (0,255,0), -1)
                    cv2.putText(temp_frame, message_text, (msg_x, msg_y), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,0), 3)

                    cv2.imshow("frame", temp_frame)
                    cv2.waitKey(1)

        # OpenCV ile kullanıcıdan cevap al
                user_answer = ""
                print("Cevabınızı yazın (ENTER ile gönderin):")

                while True:
                    temp_frame = frame.copy()
                    answer_text = f"Cevabiniz: {user_answer}_"
                    (ans_width, ans_height), _ = cv2.getTextSize(answer_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)
                    ans_x = (W - ans_width) // 2
                    ans_y = H // 2

                    cv2.rectangle(temp_frame, (ans_x-20, ans_y-40), (ans_x+ans_width+20, ans_y+20), (255,255,0), -1)
                    cv2.putText(temp_frame, answer_text, (ans_x, ans_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,0), 2)

                    cv2.imshow("frame", temp_frame)
                    k = cv2.waitKey(1)

                    if k == 13:  # ENTER
                        break
                    elif k == 8:  # BACKSPACE
                        user_answer = user_answer[:-1]
                    elif k != -1 and 32 <= k <= 126:  # yazılabilir karakterler
                        user_answer += chr(k)

        # Kullanıcının cevabını 10 saniye ekranda göster
                start_time = time.time()
                while time.time() - start_time < 3:
                   # 1️⃣ Kullanıcının cevabını ekranda göster
                    temp_frame = frame.copy()
                    final_answer_text = f"Cevabiniz: {user_answer}"
                    (fa_width, fa_height), _ = cv2.getTextSize(final_answer_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)
                    fa_x = (W - fa_width) // 2
                    fa_y = H // 2
                    cv2.rectangle(temp_frame, (fa_x-20, fa_y-40), (fa_x+fa_width+20, fa_y+20), (0,200,255), -1)
                    cv2.putText(temp_frame, final_answer_text, (fa_x, fa_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,0), 2)
                    cv2.imshow("frame", temp_frame)
                    cv2.waitKey(3000)  # 3 saniye bekle

                   # 2️⃣ Kullanıcının cevabına göre işaret dili görsellerini göster
                    for char in user_answer.upper():
                        if char == " ":
                            # Boşluk için beyaz görsel oluştur
                            blank_img = 255 * np.ones((400, 400, 3), dtype=np.uint8)  
                            cv2.imshow("Sign Language Output", blank_img)
                            cv2.waitKey(500)  # boşluğu da 0.5 saniye göster
                            continue  

                        img_path = os.path.join("datarevorce", f"{char}.jpg")
                        if os.path.exists(img_path):
                            sign_img = cv2.imread(img_path)
                            sign_img = cv2.resize(sign_img, (400, 400))
                            cv2.imshow("Sign Language Output", sign_img)
                            cv2.waitKey(500)  # her harfi 0.5 saniye göster

                    cv2.waitKey(1000)  # son görselden sonra 1 saniye bekle