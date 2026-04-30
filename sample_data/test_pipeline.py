"""
Full pipeline test for both sample datasets.
Tests: /train → /status (poll) → /results → /metadata → /predict
"""
import requests, time, json

BASE = "http://127.0.0.1:8001"
DATASETS = [
    {
        "path": "sample_data/credit_default_classification.csv",
        "target": "default",
        "task_type": "auto",
        "name": "Credit Default (Classification)",
    },
    {
        "path": "sample_data/house_price_regression.csv",
        "target": "price",
        "task_type": "auto",
        "name": "House Price (Regression)",
    },
]


def separator(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def check_health():
    r = requests.get(f"{BASE}/health", timeout=5)
    print("  /health →", r.status_code, r.json())


def train_and_poll(dataset):
    separator(f"TRAINING: {dataset['name']}")
    with open(dataset["path"], "rb") as f:
        files = {"file": (dataset["path"].split("/")[-1], f, "text/csv")}
        data  = {"target_column": dataset["target"], "task_type": dataset["task_type"]}
        r = requests.post(f"{BASE}/train", files=files, data=data, timeout=15)

    if not r.ok:
        print("  ❌ /train failed:", r.status_code, r.text)
        return None

    job_id = r.json()["job_id"]
    print(f"  ✅ Job started: {job_id}")

    # Poll /status until done or failed
    for attempt in range(120):  # max 4 min
        time.sleep(2)
        s = requests.get(f"{BASE}/status/{job_id}", timeout=5).json()
        print(f"  [{attempt+1:02d}] step={s['step']}/{s['total_steps']} | {s['stage']:30s} | {s['progress']}% | {s['status']}")
        if s["status"] == "done":
            print("  ✅ Training complete!")
            return job_id
        if s["status"] == "failed":
            print("  ❌ Training FAILED:", s.get("error"))
            return None

    print("  ⚠️  Timeout waiting for training.")
    return None


def check_results(job_id, name):
    separator(f"RESULTS: {name}")
    r = requests.get(f"{BASE}/results/{job_id}", timeout=5)
    if not r.ok:
        print("  ❌ /results failed:", r.status_code, r.text)
        return None
    res = r.json()
    print(f"  Model:    {res['model_name']}")
    print(f"  Task:     {res['task_type']}")
    print(f"  Samples:  {res['n_samples']}  Features: {res['n_features']}")
    print(f"  Time:     {res['training_time_sec']}s")
    print("  Metrics:")
    for k, v in (res.get("metrics") or {}).items():
        if v is not None:
            print(f"    {k}: {v:.4f}")
    print("  Top features:", list(res.get("feature_importance", {}).keys())[:5])
    return res


def check_metadata(name):
    separator(f"METADATA: {name}")
    r = requests.get(f"{BASE}/metadata", timeout=5)
    if not r.ok:
        print("  ❌ /metadata failed:", r.status_code)
        return None
    meta = r.json()
    print(f"  available: {meta.get('available')}")
    print(f"  model:     {meta.get('model_name')}")
    print(f"  task_type: {meta.get('task_type')}")
    print(f"  target:    {meta.get('target_col')}")
    features = meta.get("features", {})
    print(f"  features ({len(features)}):")
    for col, spec in list(features.items())[:5]:
        print(f"    {col}: type={spec['type']} | sample={spec['sample']} | values={spec['values']}")
    return meta


def check_predict(meta, name):
    separator(f"INFERENCE: {name}")
    features = meta.get("features", {})
    if not features:
        print("  ❌ No features in metadata, skipping predict.")
        return
    # Build payload from sample values
    payload = {col: spec["sample"] for col, spec in features.items()}
    print("  Input:", json.dumps(payload, indent=4)[:300])
    r = requests.post(f"{BASE}/predict", json={"data": [payload]}, timeout=10)
    if not r.ok:
        print("  ❌ /predict failed:", r.status_code, r.text[:300])
        return
    pred = r.json()
    print(f"  ✅ Prediction: {pred['predictions']}")
    print(f"  Request ID: {pred['request_ids']}")


def main():
    print("\n🚀 Autonomous ML Builder — Full Pipeline Test")
    check_health()

    for ds in DATASETS:
        job_id = train_and_poll(ds)
        if job_id:
            res  = check_results(job_id, ds["name"])
            meta = check_metadata(ds["name"])
            if meta and meta.get("available"):
                check_predict(meta, ds["name"])

    separator("TEST COMPLETE")
    print("  All checks finished.\n")


if __name__ == "__main__":
    main()
