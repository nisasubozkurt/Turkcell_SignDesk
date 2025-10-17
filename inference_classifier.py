import pickle
import cv2
import mediapipe as mp
import numpy as np
import time

model_dict = pickle.load(open('./combined_model.p', 'rb'))
model = model_dict['model']

#cap = cv2.VideoCapture(0) # 0 genellikle dahili kamera,telefonumu açtı ama
# Eğer çalışmazsa 1 deneyin
cap = cv2.VideoCapture(1)

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

labels_dict = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T', 20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z'}

# Harfleri tutmak için değişkenler
current_word = []  # Şu anki kelime
last_letter = None  # Son tanınan harf
letter_hold_time = 0  # Harfi tutma süresi
letter_display_duration = 2.0  # Harfi ekranda tutma süresi (saniye)
confidence_threshold = 0.7  # Güven eşiği
last_prediction_time = 0  # Son tahmin zamanı
prediction_cooldown = 0.5  # Tahminler arası bekleme süresi (saniye)

# Kamera açıldıktan sonra 3 saniye bekleme için değişkenler
camera_start_time = time.time()
countdown_duration = 3.0  # 3 saniye
detection_started = False

# Her harf için 3 saniye bekleme değişkenleri
letter_confirmation_delay = 3.0  # Her harf için 3 saniye bekleme
current_letter_start_time = None  # Mevcut harfin başlama zamanı
pending_letter = None  # Bekleyen harf
letter_confirmed = False  # Harf onaylandı mı?
word_formation_active = True  # Kelime oluşturma aktif mi?

print("Kamera açılıyor... 3 saniye sonra harf algılama başlayacak.")
print("Her harf için 3 saniye bekleyin, ENTER ile kelimeyi tamamlayın.")

while True:
    data_aux = []
    x_ = []
    y_ = []

    ret, frame = cap.read()

    if not ret:  # Check if frame is valid
        print("Failed to grab frame, exiting...")
        break

    # Görüntüyü yatay olarak çevir (mirror effect)
    frame = cv2.flip(frame, 1)

    H, W, _ = frame.shape
    current_time = time.time()
    
    # Countdown timer - 3 saniye bekleme
    if not detection_started:
        elapsed_time = current_time - camera_start_time
        remaining_time = countdown_duration - elapsed_time
        
        if remaining_time > 0:
            # Countdown ekranını göster
            countdown_text = f"Baslamaya: {int(remaining_time) + 1}"
            (text_width, text_height), _ = cv2.getTextSize(countdown_text, cv2.FONT_HERSHEY_SIMPLEX, 2.0, 4)
            text_x = (W - text_width) // 2
            text_y = H // 2
            
            # Countdown için güzel çerçeve
            box_x1 = text_x - 40
            box_y1 = text_y - text_height - 20
            box_x2 = text_x + text_width + 40
            box_y2 = text_y + 20
            
            cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (255, 255, 255), -1)
            cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 0), 3)
            cv2.putText(frame, countdown_text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (0, 0, 0), 4)
            
            # Alt bilgi
            info_text = "Kamera hazirlaniyor..."
            (info_width, _), _ = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)
            info_x = (W - info_width) // 2
            cv2.putText(frame, info_text, (info_x, H - 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            
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
            mp_drawing.draw_landmarks(
                frame,  # image to draw
                hand_landmarks,  # model output
                mp_hands.HAND_CONNECTIONS,  # hand connections
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style())

        for hand_landmarks in results.multi_hand_landmarks:
            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y

                x_.append(x)
                y_.append(y)

            # Normalize coordinates
            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                data_aux.append(x - min(x_))
                data_aux.append(y - min(y_))

        # Ensure the number of features is 42
        if len(data_aux) > 42:
            data_aux = data_aux[:42]

        x1 = int(min(x_) * W) - 10
        y1 = int(min(y_) * H) - 10

        x2 = int(max(x_) * W) - 10
        y2 = int(max(y_) * H) - 10

        # Tahmin yapma ve harfi ekleme
        if current_time - last_prediction_time > prediction_cooldown and word_formation_active:
            prediction = model.predict([np.asarray(data_aux)])
            predicted_character = labels_dict[int(prediction[0])]
            
            # Yeni harf algılandığında
            if predicted_character != pending_letter:
                pending_letter = predicted_character
                current_letter_start_time = current_time
                letter_confirmed = False
                last_prediction_time = current_time
                print(f"Yeni harf algılandı: {predicted_character} - 3 saniye bekleniyor...")
            
            # Harf 3 saniye tutulduğunda onayla
            elif pending_letter and current_letter_start_time and not letter_confirmed:
                if current_time - current_letter_start_time >= letter_confirmation_delay:
                    # Harfi kelimeye ekle
                    current_word.append(pending_letter)
                    last_letter = pending_letter
                    letter_confirmed = True
                    print(f"Harf onaylandı ve kelimeye eklendi: {pending_letter}")
                    print(f"Güncel kelime: {''.join(current_word)}")
                    
                    # Yeni harf için hazırla
                    pending_letter = None
                    current_letter_start_time = None

        # Bekleyen harfi göster
        if pending_letter and not letter_confirmed:
            # Harf onaylanma süresini hesapla
            elapsed_letter_time = current_time - current_letter_start_time if current_letter_start_time else 0
            remaining_letter_time = letter_confirmation_delay - elapsed_letter_time
            
            if remaining_letter_time > 0:
                # Harf onaylanma countdown'ını göster
                countdown_text = f"Harf: {pending_letter} - Onaylanmaya: {int(remaining_letter_time) + 1}s"
                (text_width, text_height), _ = cv2.getTextSize(countdown_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)
                text_x = (W - text_width) // 2
                text_y = H // 2 + 100
                
                # Countdown için güzel çerçeve
                box_x1 = text_x - 20
                box_y1 = text_y - text_height - 10
                box_x2 = text_x + text_width + 20
                box_y2 = text_y + 10
                
                cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 255, 0), -1)  # Yeşil arka plan
                cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 0), 2)
                cv2.putText(frame, countdown_text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 3)
                
                # Progress bar göster
                progress_width = 300
                progress_height = 20
                progress_x = (W - progress_width) // 2
                progress_y = text_y + 30
                
                # Progress bar arka planı
                cv2.rectangle(frame, (progress_x, progress_y), (progress_x + progress_width, progress_y + progress_height), (200, 200, 200), -1)
                
                # Progress bar doluluk oranı
                progress_fill = int((elapsed_letter_time / letter_confirmation_delay) * progress_width)
                cv2.rectangle(frame, (progress_x, progress_y), (progress_x + progress_fill, progress_y + progress_height), (0, 255, 0), -1)
                
                # Progress bar kenarlığı
                cv2.rectangle(frame, (progress_x, progress_y), (progress_x + progress_width, progress_y + progress_height), (0, 0, 0), 2)

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 0), 4)
        cv2.putText(frame, last_letter if last_letter else "?", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 0, 0), 3,
                    cv2.LINE_AA)

    # Ekranda kelimeyi göster (sadece kelime oluşturma aktifken)
    if current_word and word_formation_active:
        # Kelimeyi ekranın alt ortasında göster
        word_text = "".join(current_word)
        
        # Kelime metni için boyut hesapla
        (word_width, word_height), _ = cv2.getTextSize(f"Metin: {word_text}", cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)
        
        # Çerçeve koordinatları (alt orta)
        box_x1 = (W - word_width - 40) // 2  # Sol kenar
        box_x2 = (W + word_width + 40) // 2  # Sağ kenar
        box_y1 = H - 140  # Üst kenar
        box_y2 = H - 30   # Alt kenar
        
        # Güzel çerçeve çiz
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (255, 255, 255), -1)  # Beyaz arka plan
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 0), 3)  # Siyah kenarlık
        
        # Kelimeyi çerçevenin ortasına yaz
        word_x = (W - word_width) // 2
        cv2.putText(frame, f"Metin: {word_text}", (word_x, H-80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 3)
        
        # Son harfi vurgula (boşluk değilse)
        if last_letter and last_letter != " ":
            (last_width, _), _ = cv2.getTextSize(f"Son Harf: {last_letter}", cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            last_x = (W - last_width) // 2
            cv2.putText(frame, f"Son Harf: {last_letter}", (last_x, H-110), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
        elif last_letter == " ":
            # Son karakter boşluk ise
            (last_width, _), _ = cv2.getTextSize("Son Karakter: [BOŞLUK]", cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            last_x = (W - last_width) // 2
            cv2.putText(frame, "Son Karakter: [BOŞLUK]", (last_x, H-110), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    # Kelime oluşturma durdurulduğunda bilgi mesajı göster
    elif current_word and not word_formation_active:
        # Kelime tamamlandı mesajı
        message_text = f"Kelime Tamamlandi: {''.join(current_word)}"
        (msg_width, msg_height), _ = cv2.getTextSize(message_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)
        msg_x = (W - msg_width) // 2
        msg_y = H // 2 + 50
        
        # Mesaj için güzel çerçeve
        box_x1 = msg_x - 30
        box_y1 = msg_y - msg_height - 15
        box_x2 = msg_x + msg_width + 30
        box_y2 = msg_y + 15
        
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 255, 0), -1)  # Yeşil arka plan
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 0), 3)
        cv2.putText(frame, message_text, (msg_x, msg_y), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 3)
        
        # Alt bilgi
        info_text = "Devam icin SPACE (bosluk), yeni metin icin C tusuna basin"
        (info_width, _), _ = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        info_x = (W - info_width) // 2
        cv2.putText(frame, info_text, (info_x, msg_y + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Kullanım talimatları (en altta)
    cv2.putText(frame, "Q: Cikis, SPACE: Bosluk Ekle, C: Metni Temizle, BACKSPACE: Son Harfi Sil, ENTER: Metni Tamamla", (10, H-20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 2)

    cv2.imshow('frame', frame)

    # Tuş kontrolü - daha güvenilir çıkış için
    key = cv2.waitKey(1)
    if key != -1:  # Herhangi bir tuş basıldıysa
        key = key & 0xFF
        print(f"Tuş kodu algılandı: {key} (ASCII: {chr(key) if 32 <= key <= 126 else 'Özel'})")  # Debug için tuş kodunu göster
        
        if key == ord('q') or key == ord('Q'):
            print("Q tuşu ile çıkılıyor...")
            break
        elif key == 27:  # ESC tuşu
            print("ESC tuşu ile çıkılıyor...")
            break
        elif key == ord('c') or key == ord('C'):  # C tuşu - kelimeyi tamamen temizle
            current_word.clear()
            last_letter = None
            pending_letter = None
            current_letter_start_time = None
            letter_confirmed = False
            word_formation_active = True
            print("Kelime tamamen temizlendi! Yeni kelime oluşturmaya başlayın.")
        elif key == 32:  # SPACE tuşu - kelimeler arası boşluk ekle
            if current_word:  # Sadece kelime varsa boşluk ekle
                current_word.append(" ")  # Boşluk ekle
                last_letter = " "  # Son karakteri boşluk yap
                word_formation_active = True  # Yeni harf tanımayı aktif hale getir
                pending_letter = None
                current_letter_start_time = None
                letter_confirmed = False
                print("Kelimeler arası boşluk eklendi. Yeni kelime için harf gösterin.")
            else:
                print("Önce harf ekleyin, sonra boşluk ekleyebilirsiniz.")
        elif key == 8:  # BACKSPACE tuşu - son harfi sil
            print("BACKSPACE tuşu algılandı!")  # Debug mesajı
            if current_word:
                removed_letter = current_word.pop()
                print(f"Son karakter silindi: {repr(removed_letter)}")  # repr() ile karakteri net göster
                
                # last_letter'i güncelle
                if current_word:
                    last_letter = current_word[-1]
                    print(f"Güncel metin: {''.join(current_word)}")
                    print(f"Son karakter: {repr(last_letter)}")
                else:
                    last_letter = None
                    print("Metin boş! Yeni harf ekleyin.")
                
                # Bekleyen harf varsa temizle
                pending_letter = None
                current_letter_start_time = None
                letter_confirmed = False
                
                # Harf tanımayı tekrar aktif hale getir
                word_formation_active = True
            else:
                print("Silinecek karakter yok! Metin zaten boş.")
        elif key == 127:  # Alternatif BACKSPACE kodu (bazı sistemlerde)
            print("Alternatif BACKSPACE tuşu algılandı!")  # Debug mesajı
            if current_word:
                removed_letter = current_word.pop()
                print(f"Son karakter silindi: {repr(removed_letter)}")
                
                # last_letter'i güncelle
                if current_word:
                    last_letter = current_word[-1]
                    print(f"Güncel metin: {''.join(current_word)}")
                    print(f"Son karakter: {repr(last_letter)}")
                else:
                    last_letter = None
                    print("Metin boş! Yeni harf ekleyin.")
                
                # Bekleyen harf varsa temizle
                pending_letter = None
                current_letter_start_time = None
                letter_confirmed = False
                
                # Harf tanımayı tekrar aktif hale getir
                word_formation_active = True
            else:
                print("Silinecek karakter yok! Metin zaten boş.")
        elif key == 13:  # ENTER tuşu - kelimeyi tamamla
            if current_word:
                word_formation_active = False
                print(f"Kelime tamamlandı: {''.join(current_word)}")
                print("Yeni harf tanıma durduruldu. Yeni kelime için SPACE tuşuna basın.")
                # Kelimeyi koru ama yeni harf eklemeyi durdur
                pending_letter = None
                current_letter_start_time = None
                letter_confirmed = False
            else:
                print("Kelime boş! Önce harf ekleyin.")

cap.release()
cv2.destroyAllWindows()



