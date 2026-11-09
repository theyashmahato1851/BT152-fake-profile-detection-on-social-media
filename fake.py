"""
Fake Twitter/X Profile Detection — Streamlit Web App
=====================================================
Run with:  streamlit run fake.py

Features:
  • Secure local authentication (PBKDF2-SHA256)
  • Interactive prediction form with probability gauge
  • Model metrics dashboard (accuracy, precision, recall, F1, ROC-AUC)
  • Feature importance chart
  • Risk-level colour coding
"""

from pathlib import Path
import json
import hashlib
import hmac
import os
import sqlite3

import joblib
import pandas as pd
import streamlit as st
from PIL import Image

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent
DB_PATH = BASE / "data.db"
MODEL_PATH = BASE / "artifacts" / "fake_profile_model.joblib"
METRICS_PATH = BASE / "artifacts" / "metrics.json"
IMPORTANCE_PATH = BASE / "artifacts" / "feature_importance.json"
BANNER_PATH = BASE / "F.jpeg"

FEATURES = [
    "statuses_count",
    "followers_count",
    "friends_count",
    "favourites_count",
    "listed_count",
    "has_url",
    "has_time_zone",
]


# ---------------------------------------------------------------------------
# Database helpers (SQLite)
# ---------------------------------------------------------------------------
def _db():
    return sqlite3.connect(DB_PATH)


def _setup_db():
    with _db() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS userstable "
            "(username TEXT PRIMARY KEY, password TEXT NOT NULL)"
        )


# ---------------------------------------------------------------------------
# Password hashing — PBKDF2-SHA256 with random salt
# ---------------------------------------------------------------------------
def _hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return f"pbkdf2_sha256${salt}${dk.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    if stored_hash.startswith("pbkdf2_sha256$"):
        _, salt, _ = stored_hash.split("$", 2)
        return hmac.compare_digest(_hash_password(password, salt), stored_hash)
    # Legacy: plain SHA-256 (migrated from old code)
    return hmac.compare_digest(
        hashlib.sha256(password.encode()).hexdigest(), stored_hash
    )


# ---------------------------------------------------------------------------
# Model loader (cached so it's loaded only once)
# ---------------------------------------------------------------------------
@st.cache_resource
def _load_model():
    return joblib.load(MODEL_PATH)


@st.cache_data
def _load_metrics():
    return json.loads(METRICS_PATH.read_text())


@st.cache_data
def _load_importance():
    if IMPORTANCE_PATH.exists():
        return json.loads(IMPORTANCE_PATH.read_text())
    return None


# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------
def _risk_level(prob: float) -> tuple[str, str]:
    """Return (label, colour) based on fake-profile probability."""
    if prob >= 0.75:
        return "High Risk", "🔴"
    elif prob >= 0.50:
        return "Medium Risk", "🟠"
    elif prob >= 0.25:
        return "Low Risk", "🟡"
    else:
        return "Very Low Risk", "🟢"


# ---------------------------------------------------------------------------
# Page: Auth  (Sign-in / Sign-up)
# ---------------------------------------------------------------------------
def _render_auth():
    st.markdown("##### Please sign in or create an account to continue")

    tab_login, tab_signup = st.tabs(["🔑 Sign In", "📝 Create Account"])

    with tab_login:
        with st.form("login_form"):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Sign In", type="primary")

        if submitted:
            with _db() as conn:
                row = conn.execute(
                    "SELECT password FROM userstable WHERE username = ?",
                    (username.strip(),),
                ).fetchone()
            if row and _verify_password(password, row[0]):
                st.session_state.auth = True
                st.session_state.username = username.strip()
                st.rerun()
            else:
                st.error("Invalid username or password.")

    with tab_signup:
        with st.form("signup_form"):
            new_user = st.text_input("Choose a username")
            new_pass = st.text_input("Choose a password", type="password")
            confirm = st.text_input("Confirm password", type="password")
            created = st.form_submit_button("Create Account", type="primary")

        if created:
            try:
                u = new_user.strip()
                if len(u) < 3:
                    raise ValueError("Username must be at least 3 characters.")
                if len(new_pass) < 8:
                    raise ValueError("Password must be at least 8 characters.")
                if new_pass != confirm:
                    raise ValueError("Passwords do not match.")
                with _db() as conn:
                    conn.execute(
                        "INSERT INTO userstable VALUES (?, ?)",
                        (u, _hash_password(new_pass)),
                    )
                st.success("✅ Account created! Switch to **Sign In** to continue.")
            except sqlite3.IntegrityError:
                st.error("Username already taken.")
            except ValueError as e:
                st.error(str(e))


# ---------------------------------------------------------------------------
# Page: Prediction form
# ---------------------------------------------------------------------------
def _render_prediction():
    st.subheader("🔍 Analyse a Twitter/X Account")
    st.caption(
        "Enter the public statistics of a Twitter/X profile. "
        "The model estimates whether the profile looks fake based on metadata patterns."
    )

    with st.form("prediction_form"):
        col1, col2 = st.columns(2)

        statuses = col1.number_input(
            "Posts / Tweets",
            min_value=0,
            step=1,
            help="Total number of tweets the account has posted",
        )
        followers = col2.number_input(
            "Followers",
            min_value=0,
            step=1,
            help="Number of people following this account",
        )
        friends = col1.number_input(
            "Following",
            min_value=0,
            step=1,
            help="Number of accounts this profile follows",
        )
        favourites = col2.number_input(
            "Favourites / Likes",
            min_value=0,
            step=1,
            help="Total likes given by this account",
        )
        listed = col1.number_input(
            "Listed Count",
            min_value=0,
            step=1,
            help="Number of public lists that include this account",
        )
        has_url = int(
            col2.checkbox(
                "Profile has a URL",
                help="Does the profile contain a website link?",
            )
        )
        has_tz = int(
            col1.checkbox(
                "Time-zone info available",
                help="Does the profile have time-zone metadata?",
            )
        )

        submitted = st.form_submit_button("🚀 Check Profile", type="primary", use_container_width=True)

    if submitted:
        # Build input DataFrame with the same columns the model expects
        input_data = pd.DataFrame(
            [
                {
                    "statuses_count": statuses,
                    "followers_count": followers,
                    "friends_count": friends,
                    "favourites_count": favourites,
                    "listed_count": listed,
                    "has_url": has_url,
                    "has_time_zone": has_tz,
                }
            ]
        )

        model = _load_model()
        prob = float(model.predict_proba(input_data)[0, 1])
        label, icon = _risk_level(prob)

        st.divider()

        # Result cards
        r1, r2, r3 = st.columns(3)
        r1.metric("Fake Probability", f"{prob:.1%}")
        r2.metric("Risk Level", f"{icon} {label}")
        r3.metric("Verdict", "Possibly Fake" if prob >= 0.5 else "Likely Real")

        # Contextual message
        if prob >= 0.75:
            st.error(
                "⚠️ **High risk** — This profile's metadata strongly resembles fake accounts. "
                "Manual review is recommended."
            )
        elif prob >= 0.50:
            st.warning(
                "🟠 **Medium risk** — Some indicators suggest this could be a fake profile. "
                "Consider checking the account's activity history."
            )
        elif prob >= 0.25:
            st.info(
                "🟡 **Low risk** — The profile shows mostly genuine patterns, "
                "but a few indicators are borderline."
            )
        else:
            st.success(
                "🟢 **Very low risk** — This profile's metadata is consistent with genuine accounts."
            )

        st.caption(
            "ℹ️ This is a screening estimate only — not proof of deception. "
            "Always apply human judgement."
        )


# ---------------------------------------------------------------------------
# Page: Model Metrics dashboard
# ---------------------------------------------------------------------------
def _render_metrics():
    st.subheader("📊 Model Performance")

    metrics = _load_metrics()

    # Top-line metrics
    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Accuracy", f"{metrics['accuracy']:.2%}")
    m2.metric("Precision", f"{metrics['precision']:.2%}")
    m3.metric("Recall", f"{metrics['recall']:.2%}")
    m4.metric("F1 Score", f"{metrics['f1_score']:.2%}")
    m5.metric("ROC-AUC", f"{metrics['roc_auc']:.4f}")

    st.divider()

    col_cm, col_fi = st.columns(2)

    # Confusion matrix
    with col_cm:
        st.markdown("##### Confusion Matrix")
        cm = metrics["confusion_matrix"]
        cm_df = pd.DataFrame(
            cm,
            index=["Actual Real", "Actual Fake"],
            columns=["Predicted Real", "Predicted Fake"],
        )
        st.dataframe(cm_df, use_container_width=True)

        with st.expander("How to read this"):
            st.markdown(
                f"""
| Cell | Count | Meaning |
|------|-------|---------|
| True Negatives | {cm[0][0]} | Real accounts correctly identified |
| False Positives | {cm[0][1]} | Real accounts wrongly flagged as fake |
| False Negatives | {cm[1][0]} | Fake accounts that slipped through |
| True Positives | {cm[1][1]} | Fake accounts correctly caught |
"""
            )

    # Feature importance
    with col_fi:
        st.markdown("##### Feature Importance")
        importance = _load_importance()
        if importance:
            imp_df = (
                pd.DataFrame(
                    list(importance.items()), columns=["Feature", "Importance"]
                )
                .sort_values("Importance", ascending=True)
            )
            st.bar_chart(imp_df.set_index("Feature"), horizontal=True)
        else:
            st.info("Run `python model.py` to generate feature importance data.")

    # Dataset info
    st.divider()
    st.markdown("##### Dataset Details")
    d1, d2, d3, d4 = st.columns(4)
    d1.metric("Total Profiles", f"{metrics['dataset_size']:,}")
    d2.metric("Real Profiles", f"{metrics['real_profiles']:,}")
    d3.metric("Fake Profiles", f"{metrics['fake_profiles']:,}")
    d4.metric("Test Set Size", f"{metrics['test_size']:,}")

    with st.expander("Features used by the model"):
        for i, feat in enumerate(metrics["features"], 1):
            descriptions = {
                "statuses_count": "Total tweets/posts",
                "followers_count": "Number of followers",
                "friends_count": "Number of accounts followed",
                "favourites_count": "Total likes given",
                "listed_count": "Memberships in public lists",
                "has_url": "Whether profile has a website URL (binary)",
                "has_time_zone": "Whether time-zone info is available (binary)",
            }
            st.markdown(f"**{i}. `{feat}`** — {descriptions.get(feat, '')}")


# ---------------------------------------------------------------------------
# Main app
# ---------------------------------------------------------------------------
def main():
    st.set_page_config(
        page_title="Fake Profile Detection",
        page_icon="🔎",
        layout="wide",
    )

    _setup_db()

    # ── Header ──
    if BANNER_PATH.exists():
        col_img, col_title = st.columns([1, 3])
        with col_img:
            st.image(Image.open(BANNER_PATH), width=200)
        with col_title:
            st.title("🔎 Fake Twitter/X Profile Detection")
            st.caption("Machine Learning-powered screening of social media accounts")
    else:
        st.title("🔎 Fake Twitter/X Profile Detection")
        st.caption("Machine Learning-powered screening of social media accounts")

    # ── Pre-flight check ──
    if not MODEL_PATH.exists():
        st.warning(
            "⚠️ No trained model found. Run `python model.py` first to train the classifier."
        )
        st.code("python model.py", language="bash")
        st.stop()

    metrics = _load_metrics()
    st.sidebar.success(
        f"✅ Model loaded — trained on **{metrics['dataset_size']:,}** profiles"
    )

    # ── Auth gate ──
    if not st.session_state.get("auth"):
        _render_auth()
        return

    # ── Signed-in: sidebar info ──
    st.sidebar.markdown(f"👤 Signed in as **{st.session_state.get('username', '')}**")
    if st.sidebar.button("🚪 Sign Out"):
        st.session_state.auth = False
        st.session_state.username = ""
        st.rerun()

    # ── Main content tabs ──
    tab_predict, tab_metrics, tab_about = st.tabs(
        ["🔍 Analyse Profile", "📊 Model Metrics", "ℹ️ About"]
    )

    with tab_predict:
        _render_prediction()

    with tab_metrics:
        _render_metrics()

    with tab_about:
        st.subheader("About This Project")
        st.markdown(
            """
This is a **capstone project** that uses machine learning to detect fake Twitter/X
profiles based on publicly available account metadata.

**How it works:**
1. A **Random Forest classifier** (300 decision trees) is trained on a labelled dataset
   of **2,818 Twitter profiles** (1,481 real + 1,337 fake).
2. The model learns patterns from **7 features**: tweet count, followers, following,
   likes, listed count, profile URL presence, and time-zone availability.
3. At prediction time, the model outputs a **probability** (0–100%) that a given
   profile is fake.

**Technology stack:**
- **Python** — core language
- **scikit-learn** — ML pipeline (imputation + Random Forest)
- **Streamlit** — interactive web interface
- **pandas** — data manipulation
- **SQLite** — local user authentication
- **joblib** — model serialization
- **PBKDF2-SHA256** — secure password hashing

**Limitations:**
- Historical dataset (≈2015) — may not reflect current fake-account tactics
- Metadata-only — does not analyse tweet content, images, or social graph
- Screening tool only — not definitive proof of deception

**Potential improvements:**
- Compare classifiers (XGBoost, SVM, Neural Network) with cross-validation
- Add NLP features from tweet text and bio
- Collect newer labelled data
- Add SHAP-based model explainability
- Deploy to Streamlit Community Cloud
"""
        )


if __name__ == "__main__":
    main()
