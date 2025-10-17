import os

import cv2


DATA_DIR = './data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

number_of_classes = 26
dataset_size = 100

cap = cv2.VideoCapture(1)
for j in range(number_of_classes):
    if not os.path.exists(os.path.join(DATA_DIR, str(j))):
        os.makedirs(os.path.join(DATA_DIR, str(j)))

    print('Collecting data for class {}'.format(j))

    done = False
    while True:
        ret, frame = cap.read()
        # Görüntüyü yatay olarak çevir (mirror effect)
        frame = cv2.flip(frame, 1)
        cv2.putText(frame, 'Ready? Press "Q" ! :)', (100, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3,
                    cv2.LINE_AA)
        cv2.imshow('frame', frame)
        key = cv2.waitKey(25)
        if key != -1:  # Herhangi bir tuş basıldıysa
            key = key & 0xFF
            if key == ord('q') or key == ord('Q'):
                print("Q tuşu ile çıkılıyor...")
                break
            elif key == 27:  # ESC tuşu
                print("ESC tuşu ile çıkılıyor...")
                break
            elif key == ord('c') or key == ord('C'):  # C tuşu ile de çıkabilir
                print("C tuşu ile çıkılıyor...")
                break

    counter = 0
    while counter < dataset_size:
        ret, frame = cap.read()
        # Görüntüyü yatay olarak çevir (mirror effect)
        frame = cv2.flip(frame, 1)
        cv2.imshow('frame', frame)
        
        # Veri toplama sırasında da çıkabilmek için
        key = cv2.waitKey(25)
        if key != -1:  # Herhangi bir tuş basıldıysa
            key = key & 0xFF
            if key == ord('q') or key == ord('Q') or key == 27 or key == ord('c') or key == ord('C'):
                print("Veri toplama iptal ediliyor...")
                break
            
        cv2.imwrite(os.path.join(DATA_DIR, str(j), '{}.jpg'.format(counter)), frame)

        counter += 1
    
    # Eğer q, ESC veya C ile çıkıldıysa ana döngüden de çık
    if key == ord('q') or key == ord('Q') or key == 27 or key == ord('c') or key == ord('C'):
        break

cap.release()
cv2.destroyAllWindows()