"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Upload, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DEFAULT_PAYLOAD = {
  age: 28, income: 72000, home_ownership: "RENT", emp_length: 6,
  loan_intent: "PERSONAL", loan_grade: "B", loan_amnt: 15000,
  loan_int_rate: 12.5, loan_percent_income: 0.21,
  cb_person_default_on_file: "N", cb_person_cred_hist_length: 4,
};

/* ─── Colour tokens ─────────────────────────────────────────────── */
const C = {
  bg: "#0a0a0a", card: "rgba(255,255,255,0.02)", cardHov: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", borderHov: "rgba(255,255,255,0.15)",
  text: "#fff", muted: "rgba(255,255,255,0.4)", dim: "rgba(255,255,255,0.2)",
  blue: "#3b82f6", blueHov: "#60a5fa",
  green: "#34d399", red: "#f87171", yellow: "#eab308",
  inputBg: "rgba(255,255,255,0.04)",
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
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"prediction" | "shap" | "feedback" | "alerts" | "upload">("upload");

  /* ── polling ─────────────────────────────────────────────────── */
  const poll = useCallback(async () => {
    const t0 = Date.now();
    try {
      const [hRes, aRes] = await Promise.all([fetch(`${API_BASE}/health`), fetch(`${API_BASE}/alerts`)]);
      setLatency(Date.now() - t0);
      if (hRes.ok) setHealth(await hRes.json());
      if (aRes.ok) { const ad = await aRes.json(); setAlerts(ad.alerts || []); }
    } catch { setHealth(null); }
  }, []);

  useEffect(() => { poll(); const iv = setInterval(poll, 5000); return () => clearInterval(iv); }, [poll]);

  /* ── inference ───────────────────────────────────────────────── */
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
      if (sRes.ok) { const sd = await sRes.json(); if (sd.explainability?.[0]) { setShap(sd.explainability[0]); setActiveTab("shap"); } }
    } finally { setLoading(false); }
  };

  /* ── feedback ────────────────────────────────────────────────── */
  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_ids: [feedbackId], truths: [Number(feedbackLabel)] }),
      });
      setFeedbackMsg(res.ok ? "success" : "error");
    } catch { setFeedbackMsg("error"); }
  };

  /* ── file upload + CSV parse ─────────────────────────────────── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) return setFileMsg({ ok: false, text: "Only CSV files are accepted." });
    if (f.size > 5 * 1024 * 1024) return setFileMsg({ ok: false, text: "File exceeds the 5 MB limit." });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return setFileMsg({ ok: false, text: "CSV has no data rows." });
      const headers = lines[0].split(",").map(h => h.trim().replace(/"|'/g, ""));
      const rows = lines.slice(1, 51).map(line => {
        const vals = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || "").trim().replace(/"|'/g, "")]));
      });
      setCsvHeaders(headers);
      setCsvRows(rows);
      setFileMsg({ ok: true, text: `${f.name} — ${rows.length} rows loaded (showing first 50)` });
    };
    reader.readAsText(f);
  };

  const handleLoadRow = (row: Record<string, string>) => {
    const mapped: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      mapped[k] = isNaN(Number(v)) || v === "" ? v : Number(v);
    });
    setFormData(prev => ({ ...prev, ...mapped }));
    setActiveTab("prediction");
  };

  const shapData = shap
    ? Object.entries(shap).map(([k, v]) => ({ name: k.split("__").pop()?.toUpperCase() ?? k, val: v })).sort((a, b) => Math.abs(b.val) - Math.abs(a.val)).slice(0, 8)
    : [];

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: "prediction", label: "Inference", icon: <Activity style={{ width: 14, height: 14 }} /> },
    { id: "shap",       label: "SHAP",      icon: "🧠" },
    { id: "feedback",   label: "Feedback",  icon: "🔁" },
    { id: "alerts",     label: `Alerts${alerts.length > 0 ? ` (${alerts.length})` : ""}`, icon: <AlertTriangle style={{ width: 14, height: 14 }} /> },
    { id: "upload",     label: "Dataset",   icon: <Upload style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, fontFamily: "Inter,-apple-system,sans-serif" }}>

      {/* ── Sticky header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, height: 58, borderBottom: `1px solid ${C.border}`, backgroundColor: "rgba(10,10,10,0.93)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NavBack />
            <span style={{ color: C.border }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Operational Console</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StatusPill label="Pipeline" active={health?.pipeline_loaded} />
            <StatusPill label="SHAP" active={health?.explainer_loaded} />
            <span style={{ fontSize: 12, fontFamily: "monospace", padding: "4px 10px", borderRadius: 8, backgroundColor: health?.status === "ok" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: health?.status === "ok" ? C.green : C.red }}>
              {health?.status === "ok" ? `API · ${latency}ms` : "API · Offline"}
            </span>
            <RefreshBtn onClick={poll} />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* ── Tab Navigation ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
          {tabs.map(t => <TabBtn key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} hasAlert={t.id === "alerts" && alerts.length > 0} />)}
        </div>

        {/* ── PANEL: Prediction ── */}
        {activeTab === "prediction" && (
          <Panel title="Prediction Engine" subtitle="Adjust input features and execute live inference against the deployed model.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              {/* Left: form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {Object.entries(formData).map(([key, val]) => (
                    <Field key={key} label={key.replace(/_/g, " ")} value={val}
                      onChange={v => setFormData(p => ({ ...p, [key]: isNaN(Number(v)) || v === "" ? v : Number(v) }))} />
                  ))}
                </div>
                <RunBtn loading={loading} onClick={handlePredict} />
              </div>

              {/* Right: results */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ResultBox prediction={prediction} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <StatBox label="Inference Speed" value="< 10ms" sub="P95 latency" />
                  <StatBox label="Infra Constraint" value="< 1 GB" sub="RAM footprint" />
                </div>
                {prediction && (
                  <ActionBtn onClick={() => setActiveTab("shap")} label="View SHAP Explanations →" />
                )}
              </div>
            </div>
          </Panel>
        )}

        {/* ── PANEL: SHAP ── */}
        {activeTab === "shap" && (
          <Panel title="Feature Explanations (SHAP)" subtitle="Green bars push toward approval · Red bars push toward rejection · Run inference first to populate.">
            {shapData.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Fixed pixel height on wrapper — fixes Recharts -1 warning */}
                <div style={{ width: "100%", height: 320, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={shapData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={95} tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11 }} />
                      <Bar dataKey="val" radius={[0, 5, 5, 0]} barSize={18}>
                        {shapData.map((e, i) => <Cell key={i} fill={e.val > 0 ? C.green : C.red} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                        <th style={{ textAlign: "left", padding: "11px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Feature</th>
                        <th style={{ textAlign: "right", padding: "11px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>SHAP</th>
                        <th style={{ textAlign: "right", padding: "11px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(shap!).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).map(([key, val]) => (
                        <SHAPRow key={key} name={key} val={val} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState icon="🧠" text="No SHAP data yet. Run inference on the Prediction tab first." cta="Go to Inference →" onCta={() => setActiveTab("prediction")} />
            )}
          </Panel>
        )}

        {/* ── PANEL: Feedback ── */}
        {activeTab === "feedback" && (
          <Panel title="Feedback Reconciliation" subtitle="Submit delayed ground truth labels by request ID to keep the model evaluation loop running.">
            <div style={{ maxWidth: 480 }}>
              <form onSubmit={handleFeedback} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field label="Request ID" value={feedbackId} onChange={setFeedbackId} placeholder="e.g. web-req-1712345678" type="text" />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>True Label</label>
                  <select value={feedbackLabel} onChange={e => setFeedbackLabel(e.target.value)}
                    style={{ height: 42, padding: "0 14px", backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none" }}>
                    <option value="0">0 — Approved (No Default)</option>
                    <option value="1">1 — Rejected (Default)</option>
                  </select>
                </div>
                <SubmitBtn label="Submit Feedback" />
                {feedbackMsg && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: feedbackMsg === "success" ? C.green : C.red }}>
                    {feedbackMsg === "success" ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
                    {feedbackMsg === "success" ? "Feedback logged successfully." : "Failed to log feedback. Check API connection."}
                  </div>
                )}
              </form>
            </div>
          </Panel>
        )}

        {/* ── PANEL: Alerts ── */}
        {activeTab === "alerts" && (
          <Panel
            title="Drift Sentinel"
            subtitle="Live Kolmogorov-Smirnov and Chi-Square anomaly monitoring. Auto-polls every 5 seconds."
            badge={alerts.length > 0 ? `${alerts.length} active` : "Clear"}
            badgeColor={alerts.length > 0 ? C.yellow : C.green}
          >
            {alerts.length === 0 ? (
              <EmptyState icon="✅" text="No drift detected. All distributions are within normal bounds." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {alerts.slice().reverse().map((a, i) => <AlertCard key={i} alert={a} />)}
              </div>
            )}
          </Panel>
        )}

        {/* ── PANEL: Upload ── */}
        {activeTab === "upload" && (
          <Panel
            title="Dataset Upload"
            subtitle="Upload a CSV — rows are parsed client-side. Click any row to load it into the Inference engine."
            badge={csvRows.length > 0 ? `${csvRows.length} rows loaded` : undefined}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <DropZone onFile={handleFile} />
              {fileMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: fileMsg.ok ? C.green : C.red }}>
                  {fileMsg.ok ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
                  {fileMsg.text}
                </div>
              )}

              {csvRows.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                    👆 Click any row to load it into the <strong style={{ color: "#fff" }}>Inference Engine</strong> and run a prediction.
                  </p>
                  <div style={{ overflowX: "auto", borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, whiteSpace: "nowrap" }}>
                      <thead>
                        <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>#</th>
                          {csvHeaders.slice(0, 8).map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                          ))}
                          {csvHeaders.length > 8 && <th style={{ padding: "10px 14px", color: C.dim, fontSize: 10 }}>+{csvHeaders.length - 8} more</th>}
                          <th style={{ padding: "10px 14px" }} />
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 20).map((row, i) => (
                          <CsvRow key={i} row={row} headers={csvHeaders} index={i + 1} onLoad={() => handleLoadRow(row)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvRows.length > 20 && (
                    <p style={{ fontSize: 12, color: C.dim, textAlign: "center" }}>Showing first 20 of {csvRows.length} rows</p>
                  )}
                </div>
              )}

              {csvRows.length === 0 && (
                <div style={{ padding: 20, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, marginTop: 0 }}>Requirements</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[{ k: "Format", v: "CSV only" }, { k: "Max Size", v: "5 MB" }, { k: "Max Rows", v: "50,000" }, { k: "Preview", v: "First 20 rows shown" }].map(c => (
                      <div key={c.k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: C.muted }}>{c.k}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{c.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function NavBack() {
  const [hov, setHov] = useState(false);
  return (
    <Link href="/" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: hov ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", transition: "color 0.2s" }}>
      <ArrowLeft style={{ width: 15, height: 15 }} /> Home
    </Link>
  );
}

function RefreshBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: hov ? "rgba(255,255,255,0.8)" : C.muted, transition: "all 0.2s", backgroundColor: hov ? "rgba(255,255,255,0.06)" : "transparent" }}
      title="Refresh system status">
      <RefreshCcw style={{ width: 14, height: 14 }} />
    </button>
  );
}

function TabBtn({ id, label, icon, active, onClick, hasAlert }: any) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : hov ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent", marginBottom: -1, transition: "all 0.2s" }}>
      <span style={{ color: hasAlert ? C.yellow : "inherit" }}>{icon}</span>
      {label}
    </button>
  );
}

function Panel({ title, subtitle, badge, badgeColor, children }: { title: string; subtitle?: string; badge?: string; badgeColor?: string; children: React.ReactNode }) {
  return (
    <section style={{ borderRadius: 20, border: `1px solid ${C.border}`, backgroundColor: C.card, overflow: "hidden" }}>
      <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.55 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: "1px solid", borderColor: badgeColor || C.border, color: badgeColor || C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{badge}</span>}
      </div>
      <div style={{ padding: 28 }}>{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</label>
      <input type={type ?? (typeof value === "number" ? "number" : "text")} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ height: 40, padding: "0 12px", backgroundColor: C.inputBg, border: `1px solid ${focus ? C.blue : C.border}`, borderRadius: 8, color: "#fff", fontSize: 13, fontFamily: "monospace", outline: "none", width: "100%", transition: "border-color 0.2s", boxSizing: "border-box" }} />
    </div>
  );
}

function RunBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={loading} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 46, backgroundColor: loading ? "#1d4ed8" : hov ? "#60a5fa" : C.blue, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1, transition: "all 0.2s", boxShadow: hov && !loading ? "0 8px 24px rgba(59,130,246,0.3)" : "none", transform: hov && !loading ? "translateY(-1px)" : "translateY(0)" }}>
      {loading ? "Running inference…" : "Execute Inference"}
    </button>
  );
}

function SubmitBtn({ label }: { label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 42, backgroundColor: hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${hov ? "rgba(255,255,255,0.2)" : C.border}`, borderRadius: 10, color: hov ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
      {label}
    </button>
  );
}

function ActionBtn({ onClick, label }: { onClick: () => void; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "10px 16px", backgroundColor: "transparent", border: `1px solid ${hov ? C.blue : C.border}`, borderRadius: 10, color: hov ? C.blue : C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
      {label}
    </button>
  );
}

function ResultBox({ prediction }: { prediction: any }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, backgroundColor: C.card, height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center" }}>
      {prediction ? (<>
        <p style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>Classification Result</p>
        <p style={{ fontSize: 44, fontWeight: 900, color: prediction.predictions[0] === 0 ? C.green : C.red, margin: 0, letterSpacing: "-0.02em" }}>
          {prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
        </p>
        <p style={{ fontSize: 10, fontFamily: "monospace", color: C.dim, margin: 0, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prediction.request_ids?.[0]}</p>
      </>) : <p style={{ fontSize: 14, color: C.dim, fontStyle: "italic" }}>No prediction yet</p>}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, backgroundColor: C.card, padding: "16px 18px" }}>
      <p style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>{sub}</p>
    </div>
  );
}

function SHAPRow({ name, val }: { name: string; val: number }) {
  const [hov, setHov] = useState(false);
  const pct = Math.min(Math.abs(val) * 600, 100);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, backgroundColor: hov ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s" }}>
      <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 10, color: C.muted }}>{name}</td>
      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: val > 0 ? C.green : C.red }}>{val > 0 ? "+" : ""}{val.toFixed(4)}</td>
      <td style={{ padding: "10px 16px", textAlign: "right" }}>
        <div style={{ width: 64, height: 4, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginLeft: "auto" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, backgroundColor: val > 0 ? C.green : C.red }} />
        </div>
      </td>
    </tr>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: 18, borderRadius: 14, backgroundColor: hov ? "rgba(234,179,8,0.07)" : "rgba(234,179,8,0.04)", border: "1px solid rgba(234,179,8,0.12)", transition: "background 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: C.yellow, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <AlertTriangle style={{ width: 12, height: 12 }} />{alert.title}
        </span>
        <span style={{ fontSize: 10, color: C.dim, fontFamily: "monospace" }}>{new Date(alert.timestamp * 1000).toLocaleTimeString()}</span>
      </div>
      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>{alert.message}</p>
    </div>
  );
}

function DropZone({ onFile }: { onFile: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <label htmlFor="csv-upload"
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, height: 160, borderRadius: 16, border: `2px dashed ${drag ? C.blue : C.border}`, backgroundColor: drag ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "all 0.2s" }}>
      <Upload style={{ width: 28, height: 28, color: drag ? C.blue : C.muted }} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Drop a CSV file here or click to browse</p>
        <p style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Max 5 MB · CSV only</p>
      </div>
      <input type="file" accept=".csv" onChange={onFile} style={{ display: "none" }} id="csv-upload" />
    </label>
  );
}

function EmptyState({ icon, text, cta, onCta }: { icon: string; text: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ fontSize: 14, color: C.muted, maxWidth: 360, lineHeight: 1.65, margin: 0 }}>{text}</p>
      {cta && onCta && (
        <button onClick={onCta} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{cta}</button>
      )}
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: active ? C.green : "rgba(255,255,255,0.18)", display: "inline-block", boxShadow: active ? `0 0 6px ${C.green}` : "none" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)" }}>{label}</span>
    </div>
  );
}

function CsvRow({ row, headers, index, onLoad }: { row: Record<string, string>; headers: string[]; index: number; onLoad: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", backgroundColor: hov ? "rgba(59,130,246,0.06)" : "transparent", transition: "background 0.15s", cursor: "pointer" }}
      onClick={onLoad}>
      <td style={{ padding: "9px 14px", color: C.dim, fontFamily: "monospace" }}>{index}</td>
      {headers.slice(0, 8).map(h => (
        <td key={h} style={{ padding: "9px 14px", color: hov ? "rgba(255,255,255,0.8)" : C.muted, fontFamily: "monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
          {row[h] ?? "—"}
        </td>
      ))}
      {headers.length > 8 && <td style={{ padding: "9px 14px", color: C.dim }}>…</td>}
      <td style={{ padding: "9px 14px", textAlign: "right" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: hov ? C.blue : C.dim, textTransform: "uppercase", letterSpacing: "0.1em", transition: "color 0.15s" }}>
          {hov ? "Load →" : ""}
        </span>
      </td>
    </tr>
  );
}

