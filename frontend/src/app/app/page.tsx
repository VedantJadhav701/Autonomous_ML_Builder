"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DEFAULT_PAYLOAD = {
  age: 28, income: 72000, home_ownership: "RENT", emp_length: 6,
  loan_intent: "PERSONAL", loan_grade: "B", loan_amnt: 15000,
  loan_int_rate: 12.5, loan_percent_income: 0.21,
  cb_person_default_on_file: "N", cb_person_cred_hist_length: 4,
};

// Shared style tokens
const S = {
  bg: "#0a0a0a",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.4)",
  dim: "rgba(255,255,255,0.2)",
  blue: "#3b82f6",
  green: "#34d399",
  red: "#f87171",
  yellow: "#eab308",
};

export default function AppDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_PAYLOAD);
  const [prediction, setPrediction] = useState<any>(null);
  const [shap, setShap] = useState<Record<string, number> | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [feedbackId, setFeedbackId] = useState("");
  const [feedbackLabel, setFeedbackLabel] = useState("0");
  const [feedbackMsg, setFeedbackMsg] = useState<"success" | "error" | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileMsg, setFileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const poll = async () => {
      const t0 = Date.now();
      try {
        const [hRes, aRes] = await Promise.all([fetch(`${API_BASE}/health`), fetch(`${API_BASE}/alerts`)]);
        setLatency(Date.now() - t0);
        if (hRes.ok) setHealth(await hRes.json());
        if (aRes.ok) { const ad = await aRes.json(); setAlerts(ad.alerts || []); }
      } catch { setHealth(null); }
    };
    poll();
    const inv = setInterval(poll, 5000);
    return () => clearInterval(inv);
  }, []);

  const handlePredict = async () => {
    setLoading(true); setPrediction(null); setShap(null);
    try {
      const body = JSON.stringify({ data: [formData] });
      const h = { "Content-Type": "application/json" };
      const [pRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/predict`, { method: "POST", headers: h, body }),
        fetch(`${API_BASE}/explain`, { method: "POST", headers: h, body }),
      ]);
      if (pRes.ok) setPrediction(await pRes.json());
      if (sRes.ok) { const sd = await sRes.json(); if (sd.explainability?.[0]) setShap(sd.explainability[0]); }
    } finally { setLoading(false); }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request_ids: [feedbackId], truths: [Number(feedbackLabel)] }) });
      setFeedbackMsg(res.ok ? "success" : "error");
    } catch { setFeedbackMsg("error"); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) return setFileMsg({ ok: false, text: "Only CSV files are accepted." });
    if (f.size > 5 * 1024 * 1024) return setFileMsg({ ok: false, text: "File exceeds the 5 MB limit." });
    setFileMsg({ ok: true, text: `${f.name} — ${(f.size / 1024).toFixed(0)} KB ready` });
  };

  const shapData = shap ? Object.entries(shap).map(([k, v]) => ({ name: k.split("__").pop()?.toUpperCase() ?? k, val: v })).sort((a, b) => Math.abs(b.val) - Math.abs(a.val)).slice(0, 8) : [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, color: S.text }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, height: 56, borderBottom: `1px solid ${S.border}`, backgroundColor: "rgba(10,10,10,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: S.muted, fontSize: 13 }}>
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span style={{ color: S.border }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Operational Console</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Pill label="Pipeline" active={health?.pipeline_loaded} />
            <Pill label="SHAP" active={health?.explainer_loaded} />
            <span style={{ fontSize: 12, fontFamily: "monospace", color: health?.status === "ok" ? S.green : "#f87171" }}>
              {health?.status === "ok" ? `${latency}ms` : "Offline"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: 40, paddingBottom: 60, display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Section 1: Prediction ── */}
        <Card title="Prediction Engine" subtitle="Configure input features and run live inference against the deployed model.">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {Object.entries(formData).map(([key, val]) => (
                  <Field key={key} label={key.replace(/_/g, " ")} value={val}
                    onChange={v => setFormData(p => ({ ...p, [key]: isNaN(Number(v)) || v === "" ? v : Number(v) }))} />
                ))}
              </div>
              <button onClick={handlePredict} disabled={loading}
                style={{ width: "100%", height: 44, backgroundColor: loading ? "#1d4ed8" : S.blue, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Running inference…" : "Execute Inference"}
              </button>
            </div>

            <div className="lg:col-span-2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.card, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
                {prediction ? (<>
                  <p style={{ fontSize: 11, color: S.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Result</p>
                  <p style={{ fontSize: 40, fontWeight: 900, color: prediction.predictions[0] === 0 ? S.green : S.red }}>
                    {prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
                  </p>
                  <p style={{ fontSize: 10, fontFamily: "monospace", color: S.dim, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prediction.request_ids?.[0]}</p>
                </>) : <p style={{ fontSize: 14, color: S.dim, fontStyle: "italic" }}>No prediction yet</p>}
              </div>
              <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.card, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, color: S.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Inference Speed</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: S.text, marginTop: 4 }}>&lt; 10ms</p>
                </div>
                <span style={{ fontSize: 24 }}>⚡</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Section 2: SHAP ── */}
        <Card title="Feature Explanations (SHAP)" subtitle="Green = pushes toward approval · Red = pushes toward rejection" badge={shap ? "Live" : undefined}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={{ height: 260 }}>
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "#111", border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={16}>
                      {shapData.map((e, i) => <Cell key={i} fill={e.val > 0 ? S.green : S.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${S.border}`, borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: S.dim, fontStyle: "italic" }}>Run inference to generate SHAP report</p>
                </div>
              )}
            </div>

            <div style={{ borderRadius: 12, border: `1px solid ${S.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Feature</th>
                    <th style={{ textAlign: "right", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {shap ? Object.entries(shap).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 10, color: S.muted }}>{key}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: val > 0 ? S.green : S.red }}>{val > 0 ? "+" : ""}{val.toFixed(4)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} style={{ padding: "32px 16px", textAlign: "center", color: S.dim, fontStyle: "italic" }}>No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* ── Row: Feedback + Sentinel ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Feedback Reconciliation" subtitle="Match delayed ground truth to a request ID">
            <form onSubmit={handleFeedback} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Request ID" value={feedbackId} onChange={setFeedbackId} placeholder="web-req-1234567890" type="text" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>True Label</label>
                <select value={feedbackLabel} onChange={e => setFeedbackLabel(e.target.value)}
                  style={{ height: 40, padding: "0 12px", backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, fontSize: 14 }}>
                  <option value="0">0 — Approved (No Default)</option>
                  <option value="1">1 — Rejected (Default)</option>
                </select>
              </div>
              <button type="submit" style={{ height: 40, backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Submit Feedback
              </button>
              {feedbackMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: feedbackMsg === "success" ? S.green : S.red }}>
                  {feedbackMsg === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {feedbackMsg === "success" ? "Feedback logged successfully." : "Failed to log feedback."}
                </div>
              )}
            </form>
          </Card>

          <Card title="Drift Sentinel" subtitle="Live KS-Test and Chi-Square monitoring" badge={alerts.length > 0 ? `${alerts.length} active` : "Clear"}>
            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.length === 0 ? (
                <div style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: S.dim }}>
                  <CheckCircle2 className="w-6 h-6" />
                  <span style={{ fontSize: 12 }}>No active drift detected</span>
                </div>
              ) : alerts.slice().reverse().map((a, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, backgroundColor: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: S.yellow, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle className="w-3 h-3" />{a.title}
                    </span>
                    <span style={{ fontSize: 10, color: S.dim, fontFamily: "monospace" }}>{new Date(a.timestamp * 1000).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ fontSize: 11, color: S.muted, lineHeight: 1.55 }}>{a.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Dataset Upload ── */}
        <Card title="Dataset Upload" subtitle="CSV files only · max 5 MB · 50,000 row limit enforced at training">
          <label htmlFor="csv-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, height: 120, borderRadius: 12, border: `2px dashed ${S.border}`, cursor: "pointer" }}>
            <p style={{ fontSize: 14, color: S.muted }}>Drop a CSV file here or click to browse</p>
            <p style={{ fontSize: 12, color: S.dim }}>Max 5 MB · CSV only</p>
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} id="csv-upload" />
          </label>
          {fileMsg && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: fileMsg.ok ? S.green : S.red }}>
              {fileMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {fileMsg.text}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function Card({ title, subtitle, badge, children }: { title: string; subtitle?: string; badge?: string; children: React.ReactNode }) {
  return (
    <section style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>{badge}</span>}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</label>
      <input type={type ?? (typeof value === "number" ? "number" : "text")} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: 40, padding: "0 12px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#ffffff", fontSize: 14, fontFamily: "monospace", outline: "none", width: "100%" }} />
    </div>
  );
}

function Pill({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: active ? "#34d399" : "rgba(255,255,255,0.2)", display: "inline-block" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)" }}>{label}</span>
    </div>
  );
}
