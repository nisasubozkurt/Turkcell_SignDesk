import pickle
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, VotingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from lightgbm import LGBMClassifier # type: ignore
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from itertools import combinations

# Veri yükleme
data_dict = pickle.load(open('./data.pickle', 'rb'))

data = np.asarray(data_dict['data'])
labels = np.asarray(data_dict['labels'])

# Etiketleri sayısal forma dönüştürme (int türüne)
labels = np.array([int(label) for label in labels])

# Veriyi eğitim ve test olarak ayırma
x_train, x_test, y_train, y_test = train_test_split(data, labels, test_size=0.2, shuffle=True, stratify=labels)

# Modelleri tanımlama
models = {
    "Random Forest": RandomForestClassifier(),
    "LightGBM": LGBMClassifier(min_gain_to_split=0.01, min_data_in_leaf=20),
    "KNN": KNeighborsClassifier(),
    "SVM": SVC(probability=True),
    "AdaBoost": AdaBoostClassifier(),
}

# Modelleri eğitme ve test etme
results = {}
for name, model in models.items():
    model.fit(x_train, y_train)
    y_pred = model.predict(x_test)
    score = accuracy_score(y_test, y_pred)
    results[name] = score
    print(f"{name}: {score * 100:.2f}% accuracy")

# Model kombinasyonlarını test etme
combinations_results = {}

for r in range(2, len(models) + 1):
    for combo in combinations(models.items(), r):
        combo_name = ' + '.join([name for name, _ in combo])
        estimators = [(name, model) for name, model in combo]
        voting_clf = VotingClassifier(estimators=estimators, voting='soft')
        voting_clf.fit(x_train, y_train)
        y_pred_combo = voting_clf.predict(x_test)
        combo_score = accuracy_score(y_test, y_pred_combo)
        combinations_results[combo_name] = combo_score
        print(f"Combination {combo_name}: {combo_score * 100:.2f}% accuracy")

# Sonuçları tablo halinde gösterme
results["Voting Classifier"] = max(combinations_results.values())
results_df = pd.DataFrame.from_dict(results, orient='index', columns=["Accuracy"])
results_df = results_df.sort_values(by="Accuracy", ascending=False)

# Grafik Çizdirme
plt.figure(figsize=(10, 6))
plt.barh(list(combinations_results.keys()), list(combinations_results.values()), color='skyblue')
plt.xlabel("Accuracy")
plt.title("Model Combinations Accuracy")
plt.show()

# Tüm sonuçlar
print("\nSonuçlar:")
print(results_df)

# En iyi kombinasyonu yazdırma
best_combo = max(combinations_results, key=combinations_results.get)
print(f"En iyi model kombinasyonu: {best_combo} (%{combinations_results[best_combo] * 100:.2f} doğruluk)")

# Modeli kaydetme
with open('combined_model.p', 'wb') as f:
    pickle.dump({'model': voting_clf}, f)

print(f"Veri sayısı: {len(data)}")
print(f"Etiket sayısı: {len(labels)}")