import requests
import time
import pandas as pd
import json

BASE_URL = "http://127.0.0.1:8000"

def run_demo():
    print("--- STARTING AUTONOMOUS ML LIFECYCLE DEMO ---")
    
    # 1. Check Health
    print("\n[1/5] Checking System Health...")
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"Health Response: {resp.json()}")
    except:
        print("ERROR: FastAPI server not running on http://127.0.0.1:8000")
        print("Please run 'uvicorn app.main:app' in another terminal.")
        return

    # 2. Prediction Step
    print("\n[2/5] Performing Live Prediction...")
    payload = {
        "data": [
            {
                "age": 22, 
                "income": 60000, 
                "home_ownership": "RENT", 
                "emp_length": 5.0, 
                "loan_intent": "PERSONAL", 
                "loan_grade": "A", 
                "loan_amnt": 5000, 
                "loan_int_rate": 8.5,
                "loan_percent_income": 0.1,
                "cb_person_default_on_file": "N",
                "cb_person_cred_hist_length": 3
            }
        ],
        "request_ids": ["demo-req-001"]
    }
    pred_resp = requests.post(f"{BASE_URL}/predict", json=payload)
    print(f"Prediction Result: {pred_resp.json()}")

    # 3. Explainability Step
    print("\n[3/5] Generating SHAP Explanations (Operationalized)...")
    explain_resp = requests.post(f"{BASE_URL}/explain", json=payload)
    if explain_resp.status_code == 200:
        print(f"SHAP Contributions for top features: {list(explain_resp.json()['explainability'][0].items())[:3]}...")
    else:
        print(f"Explain Error: {explain_resp.text}")

    # 4. Injecting Drift (Simulation)
    print("\n[4/5] Injecting Statistical Drift (Simulating Out-Of-Distribution Data)...")
    # Sending a batch with very high income to trigger KS-Test drift
    drift_payload = {
        "data": [
            {
                "age": 30, 
                "income": 1000000, 
                "home_ownership": "OWN", 
                "emp_length": 10.0,
                "loan_intent": "VENTURE",
                "loan_grade": "A",
                "loan_percent_income": 0.05, 
                "cb_person_default_on_file": "N", 
                "cb_person_cred_hist_length": 10,
                "loan_amnt": 1000,
                "loan_int_rate": 5.0
            } for _ in range(12) # batch of 12
        ]
    }
    drift_resp = requests.post(f"{BASE_URL}/predict", json=drift_payload)
    print("Drift payload sent. Check server logs for [Numerical Drift Alert]!")

    # 5. Feedback Loop & Performance
    print("\n[5/5] Submitting Ground Truth Feedback...")
    feedback_payload = {
        "request_ids": ["demo-req-001"],
        "truths": [0] # Simulation: loan was NOT a risk (Success)
    }
    feed_resp = requests.post(f"{BASE_URL}/feedback", json=feedback_payload)
    print(f"Feedback Status: {feed_resp.json()}")
    print("\n--- DEMO COMPLETE: Lifecycle Verified ---")

if __name__ == "__main__":
    run_demo()
