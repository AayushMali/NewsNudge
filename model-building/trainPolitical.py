import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load both
df1 = pd.read_csv("indian_political_dataset.csv")
df2 = pd.read_csv("news_dataset.csv")

df = pd.concat([df1, df2], ignore_index=True)

print(df.head())
print(df['verdict'].value_counts())

# Prepare data
X = df['statement'].fillna('')
y = df['verdict']

# Train / test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# tf - idf vectorization
vectorizer = TfidfVectorizer(stop_words='english', max_df=0.7)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

#Logistic Regression
model = LogisticRegression(max_iter=1000)
model.fit(X_train_tfidf, y_train)

# Evaluation
y_pred = model.predict(X_test_tfidf)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Report:\n", classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "Political_god.pkl")
joblib.dump(vectorizer, "vectorizer_god.pkl")
print("✅ Model & vectorizer saved!")
