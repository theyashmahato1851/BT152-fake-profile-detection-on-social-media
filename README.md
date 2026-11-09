# Universal Fake Profile Detection System (X, Instagram, Facebook)

An AI-powered cybersecurity web application that classifies social media profiles as **authentic** or **fake/sybil** based on behavioral metadata patterns. Built with scikit-learn and Streamlit.

## 🚀 Key Features

- **Direct Profile URL Ingestion:** Paste any profile link from **X (Twitter)**, **Instagram**, or **Facebook** (or raw `@handles`).
- **Cross-Platform Behavioral Alignment:** Automatically resolves and normalizes cross-platform engagement features into the machine learning pipeline.
- **One-Click Presentation Presets:** Instant test buttons for *Verified Creator*, *Crypto Spambot*, *Instagram Influencer*, and *Facebook Impersonator* to guarantee flawless live viva demonstrations.
- **Forensic Threat Assessment:** Four-tier calibrated probability scoring with diagnostic behavioral checks (Follower-to-Following ratio, activity volume, profile completeness).
- **Responsive 2026 SaaS UI:** Dark-mode glassmorphism interface optimized for Mobile, Tablet, Mac, and Desktop.
- **High Forensic Accuracy:** **98.87% accuracy**, **99.39% precision**, **98.20% recall**, and **0.9995 ROC-AUC** trained on 2,818 authenticated profiles.
- **Enterprise Security:** Local user management secured with salted **PBKDF2-HMAC-SHA256** (200,000 iterations).

## 🛠️ Quick Start

```bat
# 1. Activate virtual environment
.venv\Scripts\activate

# 2. Train the Random Forest Pipeline (generates artifacts/)
python model.py

# 3. Launch the web application
streamlit run fake.py
```

The app will launch at `http://localhost:8501`.

## 📁 Project Architecture

```
├── fake.py                       # Modern Streamlit web application & URL ingestion engine
├── model.py                      # Training pipeline (Random Forest 300 trees + median imputer)
├── real_twitter_accounts.csv     # Authenticated legitimate profiles
├── fake_twitter_accounts.csv     # Authenticated fake / sybil accounts
├── requirements.txt              # Pinned Python package dependencies
├── F.jpeg                        # Modern X (@) AI security hero banner
├── data.db                       # Local SQLite authentication database
├── artifacts/                    # Serialized model & metrics
│   ├── fake_profile_model.joblib # Serialized scikit-learn pipeline
│   ├── metrics.json              # Empirical evaluation metrics
│   └── feature_importance.json   # Gini impurity feature rankings
└── Fake_Profile_Detection_Research_Paper.docx # IEEE Conference formatted research paper
```
