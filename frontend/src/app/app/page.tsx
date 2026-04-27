"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Github, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
  const [health, setHealth] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_PAYLOAD);
  const [prediction, setPrediction] = useState<any>(null);
  const [shap, setShap] = useState<Record<string, number> | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [feedbackId, setFeedbackId] = useState("");
  const [feedbackLabel, setFeedbackLabel] = useState("0");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileMsg, setFileMsg] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_ids: [feedbackId], truths: [Number(feedbackLabel)] }),
      });
      setFeedbackMsg(res.ok ? "success" : "error");
    } catch {
      setFeedbackMsg("error");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) return setFileMsg("error:Only CSV files are accepted.");
    if (f.size > 5 * 1024 * 1024) return setFileMsg("error:File exceeds the 5 MB limit.");
    setFileMsg(`ok:${f.name} — ${(f.size / 1024).toFixed(0)} KB ready`);
  };

  const shapData = shap
    ? Object.entries(shap)
        .map(([k, v]) => ({ name: k.split("__").pop()?.toUpperCase() ?? k, val: v }))
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
        .slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 h-14 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <span className="text-white/10">|</span>
          <span className="text-sm font-semibold text-white/70">Operational Console</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill label="Pipeline" active={health?.pipeline_loaded} />
          <StatusPill label="SHAP" active={health?.explainer_loaded} />
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
            {health?.status === "ok" ? (
              <span className="text-emerald-500">{latency}ms</span>
            ) : (
              <span className="text-red-400">Offline</span>
            )}
          </div>
          <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/70 transition-colors">
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* ── Section 1: Prediction Engine ─────────────────────────────────── */}
        <Card
          title="Prediction Engine"
          description="Configure input features and run live inference against the deployed model."
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Input form — 3 cols */}
            <div className="lg:col-span-3 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData).map(([key, val]) => (
                  <FieldInput
                    key={key}
                    label={key.replace(/_/g, " ")}
                    value={val}
                    onChange={(v) =>
                      setFormData((p) => ({
                        ...p,
                        [key]: isNaN(Number(v)) || v === "" ? v : Number(v),
                      }))
                    }
                  />
                ))}
              </div>
              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full h-11 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-xl text-sm font-bold text-white"
              >
                {loading ? "Running inference…" : "Execute Inference"}
              </button>
            </div>

            {/* Result — 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] h-36 flex flex-col items-center justify-center text-center">
                {prediction ? (
                  <>
                    <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-2">
                      Classification Result
                    </p>
                    <p className={`text-4xl font-black tracking-tight ${prediction.predictions[0] === 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
                    </p>
                    <p className="text-[10px] text-white/20 font-mono mt-2 truncate max-w-[90%]">
                      {prediction.request_ids?.[0]}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-white/20 italic">No prediction yet</p>
                )}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em]">Inference Speed</p>
                  <p className="text-2xl font-black text-white mt-1">{"< 10ms"}</p>
                </div>
                <Clock className="w-6 h-6 text-white/10" />
              </div>
            </div>
          </div>
        </Card>

        {/* ── Section 2: SHAP Explanations ──────────────────────────────────── */}
        <Card
          title="Feature Explanations (SHAP)"
          description="Green bars push toward approval · Red bars push toward rejection"
          badge={shap ? "Live" : undefined}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="h-64">
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={88}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                    />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={14}>
                      {shapData.map((e, i) => (
                        <Cell key={i} fill={e.val > 0 ? "#34d399" : "#f87171"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border border-white/[0.06] rounded-xl">
                  <p className="text-sm text-white/20 italic">Run inference to see contributions</p>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Feature</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {shap ? (
                    Object.entries(shap)
                      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                      .map(([key, val]) => (
                        <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5 font-mono text-white/40 text-[10px]">{key}</td>
                          <td className={`px-4 py-2.5 text-right font-bold font-mono ${val > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {val > 0 ? "+" : ""}{val.toFixed(4)}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-white/20 italic text-xs">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* ── Row: Feedback + Alerts ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feedback */}
          <Card title="Feedback Reconciliation" description="Match delayed ground truth to a request ID">
            <form onSubmit={handleFeedback} className="space-y-4">
              <FieldInput
                label="Request ID"
                value={feedbackId}
                onChange={setFeedbackId}
                placeholder="web-req-1234567890"
                type="text"
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">True Label</label>
                <select
                  value={feedbackLabel}
                  onChange={(e) => setFeedbackLabel(e.target.value)}
                  className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value="0">0 — Approved (No Default)</option>
                  <option value="1">1 — Rejected (Default)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full h-10 bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] transition-colors rounded-lg text-sm font-semibold text-white/70"
              >
                Submit Feedback
              </button>
              {feedbackMsg && (
                <div className={`flex items-center gap-2 text-xs font-medium ${feedbackMsg === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {feedbackMsg === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {feedbackMsg === "success" ? "Feedback logged successfully." : "Failed to log feedback."}
                </div>
              )}
            </form>
          </Card>

          {/* Sentinel */}
          <Card title="Drift Sentinel" description="Live KS-Test and Chi-Square alerts" badge={alerts.length > 0 ? `${alerts.length} active` : "Clear"}>
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-white/20">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xs">No active drift detected</span>
                </div>
              ) : (
                alerts.slice().reverse().map((a, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-yellow-500/[0.04] border border-yellow-500/10">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {a.title}
                      </span>
                      <span className="text-[10px] text-white/20 font-mono shrink-0">
                        {new Date(a.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ── Dataset Upload ─────────────────────────────────────────────────── */}
        <Card title="Dataset Upload" description="CSV files only · max 5 MB · 50,000 row limit enforced at training">
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center gap-3 h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all"
          >
            <div className="text-center">
              <p className="text-sm font-medium text-white/50">Drop CSV file here or click to browse</p>
              <p className="text-xs text-white/25 mt-1">Max 5 MB · CSV only</p>
            </div>
            <input type="file" accept=".csv" onChange={handleFile} className="sr-only" id="csv-upload" />
          </label>
          {fileMsg && (
            <p className={`mt-3 text-xs font-medium flex items-center gap-1.5 ${fileMsg.startsWith("ok") ? "text-emerald-400" : "text-red-400"}`}>
              {fileMsg.startsWith("ok") ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {fileMsg.split(":")[1]}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Card({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-white text-[15px]">{title}</h2>
          {description && <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{description}</p>}
        </div>
        {badge && (
          <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-white/40 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{label}</label>
      <input
        type={type ?? (typeof value === "number" ? "number" : "text")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/80 font-mono focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20"
      />
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-xs font-medium">
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-white/20"}`} />
      <span className={active ? "text-white/60" : "text-white/25"}>{label}</span>
    </div>
  );
}
