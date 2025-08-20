# 📰 NewsNudge

**NewsNudge** is a GenAI-powered project built for a hackathon, focused on **fact-checking news claims** and providing users with reliable insights.  
The aim is to tackle misinformation by combining **AI models**, **retrieval methods**, and **user-friendly design** into one platform.  

---

## 🌟 Features

- ✅ **Claim Verification** – Input a news headline/claim and get a result: **True, False, or Neutral**.  
- 📊 **Probability Scores** – Transparent confidence percentages behind every prediction.  
- 🔎 **Explainability** – Model reasoning made more interpretable.  
- 🌍 **News Aggregation (Future)** – Curated and recommended fact-checked articles.  
- 💡 **Hackathon Project** – Built under time constraints, focusing on an MVP.

---

## 🏗️ Current Progress

- 🔹 Built **base ML model** using **TF-IDF + Logistic Regression** for text classification.  
- 🔹 Added probability calibration to make confidence scores meaningful.  
- 🔹 Basic model pipeline stored under `model_building/` for experimentation.  
- 🔹 Web UI + integration in progress.  

---

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.8+
pip install -r requirements.txt
```

### Installation
```bash
git clone https://github.com/yourusername/newsnudge.git
cd newsnudge
pip install -r requirements.txt
```

### Usage
```python
# Example usage
from newsnudge import FactChecker

checker = FactChecker()
result = checker.verify_claim("Your news headline here")
print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.2f}%")
```

---

## 🔧 Tech Stack

- **Machine Learning**: scikit-learn, TF-IDF, Logistic Regression
- **Backend**: Python, Flask/FastAPI
- **Frontend**: HTML, CSS, JavaScript
- **Data Processing**: pandas, numpy
- **Model Storage**: pickle/joblib

---

## 📈 Model Performance

- **Accuracy**: ~98% on test dataset
- **Classes**: True, False, Neutral
- **Features**: TF-IDF vectorization with probability calibration
- **Dataset**: Public fact-checking dataset (details in `data/README.md`)

---

## 🎯 Roadmap

- [ ] Complete web interface integration
- [ ] Add LLM-powered explanations
- [ ] Implement real-time news retrieval
- [ ] Deploy to cloud platform
- [ ] Add support for multiple languages
- [ ] Improve model with transformer architectures

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Team

- **Aayush Mali** - [GitHub](https://github.com/aayushmali) | [LinkedIn](https://linkedin.com/in/aayushmali)
- **Rohit Mahajan** - [GitHub](https://github.com/rohitmahajan) | [LinkedIn](https://linkedin.com/in/rohitmahajan)
- **Sarthak Padale** - [GitHub](https://github.com/sarthakpadale) | [LinkedIn](https://linkedin.com/in/sarthakpadale)
- **Shreya Mhasurle** - [GitHub](https://github.com/shreyamhasurle) | [LinkedIn](https://linkedin.com/in/shreyamhasurle)
- **Riddhi Katkar** - [GitHub](https://github.com/riddhikatkar) | [LinkedIn](https://linkedin.com/in/riddhikatkar)

---

**Built with ❤️ for GenAI Hackathon**
