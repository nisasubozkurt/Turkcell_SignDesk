import pickle

with open("model.p", "rb") as f:
    data = pickle.load(f)

model = data['model']
print(type(model))

