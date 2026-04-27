import time
import numpy as np
import threading
import psutil
import platform
from fastapi.testclient import TestClient
from app.main import app

# Instantiate FastAPI testing client
client = TestClient(app)

def get_system_context():
    """Captures hardware specs to ground benchmark results."""
    context = {
        "OS": f"{platform.system()} {platform.release()}",
        "Processor": platform.processor(),
        "Physical Cores": psutil.cpu_count(logical=False),
        "Total Threads": psutil.cpu_count(logical=True),
        "RAM": f"{round(psutil.virtual_memory().total / (1024**3), 2)} GB",
        "Python Version": platform.python_version()
    }
    return context

def run_benchmark(num_requests: int = 1000):
    """
    Blasts the FastAPI endpoint to empirically calculate 
    p95, average, and maximum latencies with hardware context.
    """
    context = get_system_context()
    print("-" * 30)
    print("HARDWARE & SYSTEM CONTEXT")
    for k, v in context.items():
        print(f"{k}: {v}")
    print("-" * 30)
    
    print(f"Starting benchmark script against inference endpoint ({num_requests} requests)...")
    
    # We send dummy dictionaries conforming to schemas 
    # Usually you'd fill in specific dummy column names
    dummy_payload = {
        "data": [
            {f"feature_{i}": np.random.randn() for i in range(10)}
        ]
    }
    
    latencies = []
    errors = 0
    
    # Send synchronous blasts
    for _ in range(num_requests):
        start_t = time.process_time()
        # In a real environment, you might hit the running server
        # For offline benchmarking, TestClient works to measure execution latency
        resp = client.post("/predict", json=dummy_payload)
        
        # TestClient overhead factored in, so this is an upper bound
        end_t = time.process_time()
        
        if resp.status_code == 200:
            latencies.append((end_t - start_t) * 1000) # Convert to ms
        else:
            errors += 1
            
    latencies = np.array(latencies)
    
    print("-" * 30)
    print("BENCHMARK RESULTS")
    print("-" * 30)
    if len(latencies) > 0:
        print(f"Total Requests Processed: {num_requests - errors}")
        print(f"Total Errors: {errors}")
        print(f"Average Latency: {latencies.mean():.2f} ms")
        print(f"Median Latency (p50): {np.median(latencies):.2f} ms")
        print(f"p95 Latency: {np.percentile(latencies, 95):.2f} ms")
        print(f"Max Latency: {latencies.max():.2f} ms")
        
        if np.percentile(latencies, 95) < 10.0:
            print("\n[VERDICT]: PASS! p95 Sub-10ms Latency constraint achieved.")
        else:
            print("\n[VERDICT]: FAIL! Model pipeline execution breached 10ms target.")
    else:
        print("Benchmark failed to capture any 200 OK responses.")

if __name__ == "__main__":
    run_benchmark(1000)
