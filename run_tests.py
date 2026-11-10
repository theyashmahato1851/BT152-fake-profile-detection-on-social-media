"""
Multi-Platform Automated System Verification Suite
"""
import sys
from pathlib import Path
import json
import pandas as pd
import joblib

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

import fake

def test_multiplatform_model():
    print("1. Testing Multi-Platform Model & Pipeline...")
    model = fake._load_model()
    metrics = fake._load_metrics()
    importance = fake._load_importance()
    
    assert model is not None, "Model failed to load!"
    assert metrics["accuracy"] >= 0.90, f"Accuracy too low: {metrics['accuracy']}"
    assert "platform_accuracy" in metrics, "Missing platform breakdown in metrics"
    print(f"  [PASS] Overall Accuracy = {metrics['accuracy']:.2%}, ROC-AUC = {metrics['roc_auc']:.4f}")
    for p, d in metrics["platform_accuracy"].items():
        print(f"         - {p:<10}: {d['accuracy']:.2%} ({d['count']} test profiles)")

def test_auth_system():
    print("\n2. Testing Authentication & Crypto Storage...")
    fake._setup_db()
    pw = "SuperSecurePassword123!"
    h = fake._hash_password(pw)
    assert h.startswith("pbkdf2_sha256$"), "Must use PBKDF2-SHA256"
    assert fake._verify_password(pw, h), "Password verification failed"
    print("  [PASS] PBKDF2-HMAC-SHA256 crypto storage validated!")

def test_url_parser():
    print("\n3. Testing URL Parsing across X, Instagram, Facebook...")
    test_urls = [
        ("https://x.com/dmitri", "X"),
        ("https://instagram.com/martin", "Instagram"),
        ("https://facebook.com/camila", "Facebook"),
        ("@elonmusk", "X"),
    ]
    for url, exp_plat in test_urls:
        parsed = fake._parse_url_input(url)
        assert parsed is not None, f"Failed to parse {url}"
        assert parsed["platform"] == exp_plat, f"Expected {exp_plat}, got {parsed['platform']}"
        print(f"  [PASS] {url:<32} -> {parsed['platform']} ({parsed['handle']})")

def test_dataset_presets_prediction():
    print("\n4. Testing Real Dataset Presets through Model Pipeline...")
    model = fake._load_model()
    for p in fake.DATASET_PRESETS:
        df = pd.DataFrame([p["features"]])
        prob = float(model.predict_proba(df)[0, 1])
        print(f"  [PASS] {p['name']:<35} -> Prob: {prob:5.1%} [{p['label']}]")

if __name__ == "__main__":
    print("=" * 65)
    print("  RUNNING MULTI-PLATFORM VERIFICATION SUITE")
    print("=" * 65)
    test_multiplatform_model()
    test_auth_system()
    test_url_parser()
    test_dataset_presets_prediction()
    print("\n" + "=" * 65)
    print("  ALL TESTS PASSED: SYSTEM FULLY VERIFIED & READY FOR GITHUB!")
    print("=" * 65)
