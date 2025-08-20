import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Example: dataset with "text" and "label" columns
df = pd.read_csv("WELFake_Dataset.csv")

# Check sample
print(df.head())
print(df['label'].value_counts())

#preparing data title+text
df['content'] = df['title'].fillna('') + " " + df['text'].fillna('')

X = df['content']
y = df['label']

#testing and learning defined
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

#Vectorization (turn text → numbers)
vectorizer = TfidfVectorizer(stop_words='english', max_df=0.7)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

#Training the Model
model = LogisticRegression(max_iter=1000)
model.fit(X_train_tfidf, y_train)


#Evaluating the Model
y_pred = model.predict(X_test_tfidf)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("Report:\n", classification_report(y_test, y_pred))

# Save model + vectorizer
joblib.dump(model, "fake_news_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
print("✅ Model & vectorizer saved!")