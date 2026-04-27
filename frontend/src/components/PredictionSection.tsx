"use client";

import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PredictionSection() {
  const [inputJson, setInputJson] = useState('{\n  "data": [\n    {"age": 22, "income": 50000, "home_ownership": "RENT", "emp_length": 5.0, "loan_intent": "PERSONAL", "loan_grade": "A", "loan_amnt": 5000, "loan_int_rate": 8.5, "loan_percent_income": 0.1, "cb_person_default_on_file": "N", "cb_person_cred_hist_length": 3}\n  ]\n}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = JSON.parse(inputJson);
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold border-b pb-2">Prediction Engine</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Input JSON (Batch allowed)</label>
          <textarea 
            className="w-full h-48 font-mono text-xs p-3 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
          />
          <button 
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Processing..." : "Execute Prediction"}
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Inference Output</label>
          <div className="w-full h-64 p-3 border rounded-lg bg-white dark:bg-black border-gray-200 dark:border-zinc-800 overflow-auto">
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {result && (
              <div className="space-y-4">
                <div className="flex gap-4 items-baseline">
                  <span className="text-xs font-bold text-gray-500">Result:</span>
                  <span className={`text-2xl font-black ${result.predictions[0] === 0 ? "text-green-600" : "text-red-600"}`}>
                    {result.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Raw Payload:</span>
                  <pre className="text-[10px] text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {!result && !error && <p className="text-gray-400 text-xs italic">Waiting for input...</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
