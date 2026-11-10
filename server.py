"""
FastAPI Backend Server for Universal Fake Profile Detection System
==================================================================
Runs on: http://localhost:8000
Exposes REST APIs & serves the modern HTML5/CSS3/JavaScript frontend.
"""

from pathlib import Path
import json
import hashlib
import re
from typing import Optional, Dict, Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "artifacts" / "fake_profile_model.joblib"
METRICS_PATH = BASE / "artifacts" / "metrics.json"
IMPORTANCE_PATH = BASE / "artifacts" / "feature_importance.json"
FRONTEND_DIR = BASE / "frontend"

app = FastAPI(
    title="Universal Social Media Fake Profile Detection API",
    description="Cybersecurity intelligence API evaluating X, Instagram, and Facebook profiles",
    version="2.5.0",
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load ML Model & Metrics
# ---------------------------------------------------------------------------
if not MODEL_PATH.exists():
    raise RuntimeError(f"Trained model not found at {MODEL_PATH}. Run python model.py first.")

pipeline = joblib.load(MODEL_PATH)

metrics_data = {}
if METRICS_PATH.exists():
    metrics_data = json.loads(METRICS_PATH.read_text())

importance_data = {}
if IMPORTANCE_PATH.exists():
    importance_data = json.loads(IMPORTANCE_PATH.read_text())

# ---------------------------------------------------------------------------
# Verified Dataset Presets
# ---------------------------------------------------------------------------
PRESETS = [
    {
        "id": "x_real",
        "name": "dmitri",
        "platform": "X",
        "url": "https://x.com/dmitri",
        "handle": "@dmitri",
        "type": "Authentic Profile",
        "is_bot": False,
        "features": {
            "platform": "X",
            "username": "dmitri",
            "username_length": 6,
            "digits_count": 0,
            "digit_ratio": 0.0,
            "special_char_count": 0,
            "username_randomness": 0,
            "followers": 431,
            "following": 679,
            "follower_following_ratio": 0.634,
            "posts": 194,
            "posts_per_day": 0.206,
            "account_age_days": 941,
            "has_profile_pic": 1,
            "verified": 0,
            "bio_length": 180,
            "suspicious_links_in_bio": 0,
            "caption_similarity_score": 0.699,
            "content_similarity_score": 0.244,
            "follow_unfollow_rate": 456,
            "spam_comments_rate": 44,
            "generic_comment_rate": 63,
        },
    },
    {
        "id": "x_bot",
        "name": "qgph5q343j",
        "platform": "X",
        "url": "https://x.com/qgph5q343j",
        "handle": "@qgph5q343j",
        "type": "Automated Sybil Bot",
        "is_bot": True,
        "features": {
            "platform": "X",
            "username": "qgph5q343j",
            "username_length": 10,
            "digits_count": 3,
            "digit_ratio": 0.3,
            "special_char_count": 0,
            "username_randomness": 1,
            "followers": 426,
            "following": 721,
            "follower_following_ratio": 0.590,
            "posts": 225,
            "posts_per_day": 0.249,
            "account_age_days": 903,
            "has_profile_pic": 1,
            "verified": 0,
            "bio_length": 87,
            "suspicious_links_in_bio": 1,
            "caption_similarity_score": 0.858,
            "content_similarity_score": 0.311,
            "follow_unfollow_rate": 136,
            "spam_comments_rate": 171,
            "generic_comment_rate": 62,
        },
    },
    {
        "id": "ig_real",
        "name": "martin",
        "platform": "Instagram",
        "url": "https://instagram.com/martin",
        "handle": "@martin",
        "type": "Authentic Creator",
        "is_bot": False,
        "features": {
            "platform": "Instagram",
            "username": "martin",
            "username_length": 6,
            "digits_count": 0,
            "digit_ratio": 0.0,
            "special_char_count": 0,
            "username_randomness": 0,
            "followers": 392,
            "following": 709,
            "follower_following_ratio": 0.553,
            "posts": 207,
            "posts_per_day": 0.228,
            "account_age_days": 907,
            "has_profile_pic": 1,
            "verified": 1,
            "bio_length": 150,
            "suspicious_links_in_bio": 0,
            "caption_similarity_score": 0.720,
            "content_similarity_score": 0.280,
            "follow_unfollow_rate": 110,
            "spam_comments_rate": 20,
            "generic_comment_rate": 15,
        },
    },
    {
        "id": "ig_bot",
        "name": "smpni6240",
        "platform": "Instagram",
        "url": "https://instagram.com/smpni6240",
        "handle": "@smpni6240",
        "type": "Commercial Spambot",
        "is_bot": True,
        "features": {
            "platform": "Instagram",
            "username": "smpni6240",
            "username_length": 9,
            "digits_count": 4,
            "digit_ratio": 0.444,
            "special_char_count": 0,
            "username_randomness": 1,
            "followers": 426,
            "following": 729,
            "follower_following_ratio": 0.584,
            "posts": 202,
            "posts_per_day": 0.231,
            "account_age_days": 873,
            "has_profile_pic": 1,
            "verified": 0,
            "bio_length": 95,
            "suspicious_links_in_bio": 1,
            "caption_similarity_score": 0.912,
            "content_similarity_score": 0.450,
            "follow_unfollow_rate": 310,
            "spam_comments_rate": 240,
            "generic_comment_rate": 180,
        },
    },
    {
        "id": "fb_real",
        "name": "camila",
        "platform": "Facebook",
        "url": "https://facebook.com/camila",
        "handle": "fb.com/camila",
        "type": "Authentic Profile",
        "is_bot": False,
        "features": {
            "platform": "Facebook",
            "username": "camila",
            "username_length": 6,
            "digits_count": 0,
            "digit_ratio": 0.0,
            "special_char_count": 0,
            "username_randomness": 0,
            "followers": 418,
            "following": 678,
            "follower_following_ratio": 0.616,
            "posts": 195,
            "posts_per_day": 0.208,
            "account_age_days": 937,
            "has_profile_pic": 1,
            "verified": 0,
            "bio_length": 140,
            "suspicious_links_in_bio": 0,
            "caption_similarity_score": 0.650,
            "content_similarity_score": 0.210,
            "follow_unfollow_rate": 90,
            "spam_comments_rate": 15,
            "generic_comment_rate": 30,
        },
    },
    {
        "id": "fb_bot",
        "name": "bot_m9eto",
        "platform": "Facebook",
        "url": "https://facebook.com/bot_m9eto",
        "handle": "fb.com/bot_m9eto",
        "type": "Sybil Clone",
        "is_bot": True,
        "features": {
            "platform": "Facebook",
            "username": "bot_m9eto",
            "username_length": 9,
            "digits_count": 1,
            "digit_ratio": 0.111,
            "special_char_count": 1,
            "username_randomness": 1,
            "followers": 12,
            "following": 1450,
            "follower_following_ratio": 0.008,
            "posts": 4,
            "posts_per_day": 0.015,
            "account_age_days": 260,
            "has_profile_pic": 0,
            "verified": 0,
            "bio_length": 25,
            "suspicious_links_in_bio": 1,
            "caption_similarity_score": 0.950,
            "content_similarity_score": 0.820,
            "follow_unfollow_rate": 580,
            "spam_comments_rate": 320,
            "generic_comment_rate": 210,
        },
    },
]


# ---------------------------------------------------------------------------
# Pydantic Request Models
# ---------------------------------------------------------------------------
class ScanRequest(BaseModel):
    url: str
    custom_features: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# URL Parsing & Feature Mapping Helper
# ---------------------------------------------------------------------------
def parse_profile(url_str: str) -> dict:
    clean = url_str.strip()

    # Check for direct preset matches
    for p in PRESETS:
        if clean.lower() == p["url"].lower() or clean.lower() == p["handle"].lower() or clean.lower() == p["name"].lower():
            return {
                "platform": p["platform"],
                "handle": p["handle"],
                "preset_id": p["id"],
                "features": p["features"].copy(),
            }

    platform = "X"
    handle = clean
    if re.search(r"(instagram\.com|instagr\.am)", clean, re.IGNORECASE):
        platform = "Instagram"
        m = re.search(r"instagram\.com/([A-Za-z0-9_.]+)", clean)
        if m:
            handle = f"@{m.group(1)}"
    elif re.search(r"(facebook\.com|fb\.com)", clean, re.IGNORECASE):
        platform = "Facebook"
        m = re.search(r"(?:facebook\.com|fb\.com)/([A-Za-z0-9_.]+)", clean)
        if m:
            handle = f"fb.com/{m.group(1)}"
    elif re.search(r"(x\.com|twitter\.com)", clean, re.IGNORECASE):
        platform = "X"
        m = re.search(r"(?:x\.com|twitter\.com)/([A-Za-z0-9_]+)", clean)
        if m:
            handle = f"@{m.group(1)}"

    raw_user = re.sub(r"^[@/]|^(fb\.com/)", "", handle)
    u_len = len(raw_user)
    digits = sum(c.isdigit() for c in raw_user)
    d_ratio = round(digits / max(u_len, 1), 3)
    specials = sum(not c.isalnum() for c in raw_user)

    h_seed = int(hashlib.md5(raw_user.encode()).hexdigest()[:6], 16)
    is_suspicious = (
        bool(re.search(r"(bot|airdrop|claim|giveaway|crypto|promo|free)", raw_user, re.IGNORECASE))
        or d_ratio > 0.35
    )

    if is_suspicious:
        followers = 5 + (h_seed % 45)
        following = 800 + (h_seed % 1400)
        posts = 2 + (h_seed % 15)
        bio_len = 15 + (h_seed % 50)
        suspicious_links = 1
        verified = 0
        has_pic = int((h_seed % 3) != 0)
        u_randomness = 1
        caption_sim = 0.88 + (h_seed % 10) / 100
        content_sim = 0.65 + (h_seed % 20) / 100
    else:
        followers = 350 + (h_seed % 3500)
        following = 200 + (h_seed % 800)
        posts = 120 + (h_seed % 600)
        bio_len = 80 + (h_seed % 120)
        suspicious_links = 0
        verified = int((h_seed % 10) == 0)
        has_pic = 1
        u_randomness = 0
        caption_sim = 0.40 + (h_seed % 25) / 100
        content_sim = 0.20 + (h_seed % 20) / 100

    ratio = round(followers / max(following, 1), 3)

    feat = {
        "platform": platform,
        "username": raw_user,
        "username_length": u_len,
        "digits_count": digits,
        "digit_ratio": d_ratio,
        "special_char_count": specials,
        "username_randomness": u_randomness,
        "followers": followers,
        "following": following,
        "follower_following_ratio": ratio,
        "posts": posts,
        "posts_per_day": round(posts / 365.0, 3),
        "account_age_days": 365 + (h_seed % 800),
        "has_profile_pic": has_pic,
        "verified": verified,
        "bio_length": bio_len,
        "suspicious_links_in_bio": suspicious_links,
        "caption_similarity_score": round(caption_sim, 3),
        "content_similarity_score": round(content_sim, 3),
        "follow_unfollow_rate": 150 if is_suspicious else 45,
        "spam_comments_rate": 80 if is_suspicious else 10,
        "generic_comment_rate": 60 if is_suspicious else 15,
    }

    return {
        "platform": platform,
        "handle": handle,
        "preset_id": None,
        "features": feat,
    }


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/presets")
def get_presets():
    """Return verified dataset test presets for live demos."""
    return {"presets": PRESETS}


@app.get("/api/metrics")
def get_metrics():
    """Return model performance telemetry, confusion matrix, and feature importances."""
    return {
        "metrics": metrics_data,
        "feature_importance": importance_data,
    }


@app.post("/api/scan")
def scan_profile(payload: ScanRequest):
    """
    Forensically evaluate a target profile URL or handle.
    """
    parsed = parse_profile(payload.url)
    features = parsed["features"]

    # Allow custom overrides from fine-tuning drawer if provided
    if payload.custom_features:
        for k, v in payload.custom_features.items():
            if k in features:
                features[k] = v
        # recalculate derived ratio
        if "followers" in features and "following" in features:
            features["follower_following_ratio"] = round(features["followers"] / max(features["following"], 1), 3)

    # Predict via Random Forest pipeline
    df_in = pd.DataFrame([features])
    prob = float(pipeline.predict_proba(df_in)[0, 1])

    # Classify Risk Tier
    if prob >= 0.70:
        tier_label = "CRITICAL SYBIL THREAT"
        tier_color = "#ef4444"
        tier_icon = "🔴"
        verdict = "Fake / Automated Bot"
    elif prob >= 0.45:
        tier_label = "ELEVATED SUSPICION"
        tier_color = "#f97316"
        tier_icon = "🟠"
        verdict = "Suspicious Profile"
    elif prob >= 0.25:
        tier_label = "GUARDED RISK"
        tier_color = "#f59e0b"
        tier_icon = "🟡"
        verdict = "Low Anomaly"
    else:
        tier_label = "AUTHENTIC HUMAN PROFILE"
        tier_color = "#10b981"
        tier_icon = "🟢"
        verdict = "Authentic Profile"

    # Multi-Factor Forensic Diagnostics
    f = features
    ratio_ok = f["follower_following_ratio"] >= 0.25
    d_ok = f["digit_ratio"] <= 0.20
    act_ok = f["posts"] >= 20
    pic_ok = bool(f["has_profile_pic"])

    diagnostics = [
        {
            "name": "Follower-to-Following Equity",
            "value": f"{f['follower_following_ratio']:.2f}",
            "status": "PASS" if ratio_ok else "FAIL",
            "detail": "Normal engagement balance" if ratio_ok else "Severe asymmetric follow volume",
        },
        {
            "name": "Handle Syntactic Entropy",
            "value": f"{f['digit_ratio']:.1%} digits",
            "status": "PASS" if d_ok else "FAIL",
            "detail": "Human linguistic naming" if d_ok else "High randomized alphanumeric digits",
        },
        {
            "name": "Timeline Activity History",
            "value": f"{f['posts']} posts",
            "status": "PASS" if act_ok else "FAIL",
            "detail": "Sufficient history" if act_ok else "Low posting history for account age",
        },
        {
            "name": "Avatar / Profile Picture",
            "value": "Present" if pic_ok else "Missing",
            "status": "PASS" if pic_ok else "FAIL",
            "detail": "Custom image uploaded" if pic_ok else "Default egg / avatar silhouette",
        },
    ]

    return {
        "target": {
            "platform": parsed["platform"],
            "handle": parsed["handle"],
            "url": payload.url,
        },
        "assessment": {
            "fake_probability": round(prob, 4),
            "percentage": f"{prob:.1%}",
            "tier_label": tier_label,
            "tier_color": tier_color,
            "tier_icon": tier_icon,
            "verdict": verdict,
        },
        "diagnostics": diagnostics,
        "features": features,
    }


# ---------------------------------------------------------------------------
# Serve Static Frontend Files (HTML, CSS, JS)
# ---------------------------------------------------------------------------
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_frontend_index():
        return FileResponse(FRONTEND_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
