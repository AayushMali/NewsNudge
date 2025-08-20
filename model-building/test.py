import joblib

# Load saved model + vectorizer
model = joblib.load("political_god.pkl")
vectorizer = joblib.load("vectorizer_god.pkl")

queries = [
    "The Indian government announced a 20% increase in farmer subsidies this year.",
    "The Prime Minister attended the G20 summit yesterday.",
    "The RBI has banned the use of ₹2000 notes starting next month.",
    "Donald trump is an US president",
    "India is a country",
    "Narendra modi is indian prime minister",
    "BJP and Election Commission are colluding in vote theft"
]

for q in queries:
    vec = vectorizer.transform([q])
    pred = model.predict(vec)
    print(f"Statement: {q}\nPrediction: {pred[0]}\n")