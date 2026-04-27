"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Health {
  status: string;
  pipeline_loaded: boolean;
  explainer_loaded: boolean;
}

// ─── Default form payload ──────────────────────────────────────────────────────
const DEFAULT_PAYLOAD = {
  age: 28,
  income: 72000,
  home_ownership: "RENT",
  emp_length: 6,
  loan_intent: "PERSONAL",
  loan_grade: "B",
  loan_amnt: 15000,
  loan_int_rate: 12.5,
  loan_percent_income: 0.21,
  cb_person_default_on_file: "N",
  cb_person_cred_hist_length: 4,
};

export default function AppDashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_PAYLOAD);
  const [prediction, setPrediction] = useState<any>(null);
  const [shap, setShap] = useState<Record<string, number> | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [feedbackId, setFeedbackId] = useState("");
  const [feedbackLabel, setFeedbackLabel] = useState("0");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileMsg, setFileMsg] = useState<string | null>(null);

  // ── System health polling ───────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      const t0 = Date.now();
      try {
        const [hRes, aRes] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/alerts`),
        ]);
        setLatency(Date.now() - t0);
        if (hRes.ok) setHealth(await hRes.json());
        if (aRes.ok) {
          const ad = await aRes.json();
          setAlerts(ad.alerts || []);
        }
      } catch {
        setHealth(null);
      }
    };
    poll();
    const inv = setInterval(poll, 5000);
    return () => clearInterval(inv);
  }, []);

  // ── Inference ────────────────────────────────────────────────────────────────
  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    setShap(null);
    try {
      const body = JSON.stringify({ data: [formData] });
      const headers = { "Content-Type": "application/json" };

      const [pRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/predict`, { method: "POST", headers, body }),
        fetch(`${API_BASE}/explain`, { method: "POST", headers, body }),
      ]);

      if (pRes.ok) setPrediction(await pRes.json());
      if (sRes.ok) {
        const sd = await sRes.json();
        if (sd.explainability?.[0]) setShap(sd.explainability[0]);
      }
    } catch (e) {
      console.error("Inference error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Feedback ─────────────────────────────────────────────────────────────────
  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_ids: [feedbackId], truths: [Number(feedbackLabel)] }),
      });
      setFeedbackMsg(res.ok ? "✓ Feedback logged successfully." : "✗ Failed to log feedback.");
    } catch {
      setFeedbackMsg("✗ Network error.");
    }
  };

  // ── CSV upload ────────────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) return setFileMsg("✗ Only CSV files allowed.");
    if (f.size > 5 * 1024 * 1024) return setFileMsg("✗ File too large (max 5 MB).");
    setFile(f);
    setFileMsg(`✓ Ready: ${f.name} (${(f.size / 1024).toFixed(0)} KB)`);
  };

  // ── SHAP chart data ───────────────────────────────────────────────────────────
  const shapData = shap
    ? Object.entries(shap)
        .map(([k, v]) => ({ name: k.split("__").pop()?.toUpperCase() ?? k, val: v }))
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
        .slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black/90 backdrop-blur-md px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back
          </Link>
          <span className="text-gray-700">|</span>
          <span className="font-bold text-sm">Operational Console</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Pipeline" active={health?.pipeline_loaded} />
          <Badge label="SHAP" active={health?.explainer_loaded} />
          <div className="text-xs text-gray-500 font-mono">
            {health?.status === "ok" ? (
              <span className="text-green-500">API: {latency}ms</span>
            ) : (
              <span className="text-red-500">API: Offline</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── 1. Live Inference ─────────────────────────────────────────────── */}
        <Card title="Prediction Engine" subtitle="Adjust inputs and run live inference">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type={typeof val === "number" ? "number" : "text"}
                      value={val}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [key]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg text-sm font-bold text-white"
              >
                {loading ? "Running..." : "Execute Inference"}
              </button>
            </div>

            {/* Result */}
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 flex flex-col items-center justify-center min-h-[140px]">
                {prediction ? (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Result</p>
                    <p className={`text-5xl font-black ${prediction.predictions[0] === 0 ? "text-green-500" : "text-red-500"}`}>
                      {prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
                    </p>
                    <p className="text-xs text-gray-600 font-mono mt-2">{prediction.request_ids?.[0]}</p>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm italic">No prediction yet</p>
                )}
              </div>

              {/* SHAP chart */}
              {shapData.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">SHAP Feature Impact</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={shapData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={90}
                        tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        contentStyle={{ background: "#111", border: "1px solid #333", fontSize: 11 }}
                      />
                      <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={16}>
                        {shapData.map((e, i) => (
                          <Cell key={i} fill={e.val > 0 ? "#22c55e" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ── 2. SHAP Table ────────────────────────────────────────────────── */}
        {shap && (
          <Card title="Feature Contributions (SHAP)" subtitle="Positive values push toward approval, negative toward rejection">
            <div className="overflow-hidden rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="text-left px-4 py-3">Feature</th>
                    <th className="text-right px-4 py-3">SHAP Value</th>
                    <th className="text-right px-4 py-3">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Object.entries(shap)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                    .map(([key, val]) => (
                      <tr key={key} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{key}</td>
                        <td className={`px-4 py-2.5 text-right font-bold font-mono text-xs ${val > 0 ? "text-green-500" : "text-red-500"}`}>
                          {val > 0 ? "+" : ""}{val.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${val > 0 ? "bg-green-500" : "bg-red-500"} ml-auto`}
                                style={{ width: `${Math.min(Math.abs(val) * 1000, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── 3. Feedback ────────────────────────────────────────────────── */}
          <Card title="Ground Truth Feedback" subtitle="Reconcile delayed labels with request IDs">
            <form onSubmit={handleFeedback} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Request ID</label>
                <input
                  value={feedbackId}
                  onChange={(e) => setFeedbackId(e.target.value)}
                  placeholder="e.g. web-req-1234567890"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">True Label</label>
                <select
                  value={feedbackLabel}
                  onChange={(e) => setFeedbackLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="0">0 — Approved (No Default)</option>
                  <option value="1">1 — Rejected (Default)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg text-sm font-semibold text-white border border-gray-700"
              >
                Submit Feedback
              </button>
              {feedbackMsg && (
                <p className={`text-xs font-semibold ${feedbackMsg.startsWith("✓") ? "text-green-500" : "text-red-500"}`}>
                  {feedbackMsg}
                </p>
              )}
            </form>
          </Card>

          {/* ── 4. Sentinel Alerts ───────────────────────────────────────── */}
          <Card title="Drift Sentinel" subtitle="Live KS-Test and Chi-Square alerts">
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-sm italic">
                  No active drift detected.
                </div>
              ) : (
                alerts.slice().reverse().map((a, i) => (
                  <div key={i} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/15 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{a.title}</span>
                      <span className="text-[10px] text-gray-600 font-mono">{new Date(a.timestamp * 1000).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ── 5. Dataset Upload ──────────────────────────────────────────── */}
        <Card title="Dataset Upload" subtitle="CSV only · Max 5 MB · 50k row limit enforced at training time">
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center space-y-3 hover:border-gray-500 transition-colors">
            <p className="text-sm text-gray-400">Drop a CSV file here or click to browse</p>
            <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-upload" />
            <label
              htmlFor="csv-upload"
              className="inline-block px-6 py-2 border border-gray-700 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition-colors cursor-pointer"
            >
              Choose File
            </label>
            {fileMsg && (
              <p className={`text-xs font-semibold ${fileMsg.startsWith("✓") ? "text-green-500" : "text-red-500"}`}>
                {fileMsg}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/20 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-800">
        <h2 className="font-bold text-white text-base">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Badge({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 text-xs font-semibold">
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-600"}`} />
      <span className={active ? "text-gray-300" : "text-gray-600"}>{label}</span>
    </div>
  );
}
