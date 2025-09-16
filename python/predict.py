import sys
import json
import joblib

# --- Optimization suggestions ---
# 1. Only load model/vectorizer once if possible (not possible in subprocess-per-request, but keep code minimal).
# 2. Use efficient input parsing and prediction.
# 3. Avoid unnecessary variables and checks.

model_path = sys.argv[1]
vectorizer_path = sys.argv[2]
input_data = json.loads(sys.argv[3])

# Load model/vectorizer as efficiently as possible
model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

# Transform and predict in one step
prediction = model.predict(vectorizer.transform([input_data]))

# Output result directly
print(prediction[0])
