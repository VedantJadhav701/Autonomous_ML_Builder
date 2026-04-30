"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Upload, Activity, ChevronRight } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, CartesianGrid, ZAxis
} from "recharts";

// ─────────────────────────────────────────────────── COMPONENTS ───────────────
function RegressionChart({ data }: { data: any[] }) {
  return (
    <div style={{ height: 260, width: "100%", marginTop: 10 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" dataKey="actual" name="Actual" stroke={C.muted} fontSize={10} label={{ value: 'Actual', position: 'bottom', fill: C.muted, fontSize: 10 }} />
          <YAxis type="number" dataKey="predicted" name="Predicted" stroke={C.muted} fontSize={10} label={{ value: 'Predicted', angle: -90, position: 'insideLeft', fill: C.muted, fontSize: 10 }} />
          <ZAxis type="number" range={[40, 40]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#1a1a1a", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
          <Scatter name="Predictions" data={data} fill={C.blue} fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConfusionMatrix({ labels, matrix }: { labels: string[], matrix: number[][] }) {
  const maxVal = Math.max(...matrix.flat());
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${labels.length}, 1fr)`, gap: 4 }}>
        {matrix.flat().map((val, i) => {
          const row = Math.floor(i / labels.length);
          const col = i % labels.length;
          const opacity = 0.1 + (val / maxVal) * 0.8;
          const isDiagonal = row === col;
          return (
            <div key={i} style={{ 
              aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              backgroundColor: isDiagonal ? `rgba(52,211,153, ${opacity})` : `rgba(248,113,113, ${opacity})`,
              borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{val}</span>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{isDiagonal ? "Correct" : "Error"}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, fontSize: 10, color: C.muted }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const C = {
  bg: "#0a0a0a", card: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.08)",
  text: "#fff", muted: "rgba(255,255,255,0.4)", dim: "rgba(255,255,255,0.2)",
  blue: "#3b82f6", blueHov: "#60a5fa", green: "#34d399", red: "#f87171", yellow: "#eab308",
  inputBg: "rgba(255,255,255,0.05)",
};

const STAGE_LABELS = [
  "Profiling Data",
  "Feature Engineering",
  "Selecting Model",
  "Training + Tuning",
  "Evaluating Model",
  "Deploying Model",
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AppDashboard() {
  const [mode, setMode] = useState<"train" | "infer">("train");
  const [health, setHealth] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, fontFamily: "Inter,-apple-system,sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, height: 58, borderBottom: `1px solid ${C.border}`, backgroundColor: "rgba(10,10,10,0.94)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NavBack />
            <span style={{ color: C.border }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Operational Console</span>
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* ── Mode Toggle ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, padding: 4, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, width: "fit-content" }}>
          <ModeBtn active={mode === "train"} onClick={() => setMode("train")} icon="🔨" label="Train Model" />
          <ModeBtn active={mode === "infer"} onClick={() => setMode("infer")} icon="⚡" label="Run Inference" />
        </div>

        <div style={{ display: mode === "train" ? "block" : "none" }}>
          <TrainMode alerts={alerts} onSwitchToInfer={() => setMode("infer")} />
        </div>
        <div style={{ display: mode === "infer" ? "block" : "none" }}>
          <InferMode alerts={alerts} onSwitchToTrain={() => setMode("train")} isActive={mode === "infer"} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────── TRAIN MODE ───────────────
function TrainMode({ alerts, onSwitchToInfer }: { alerts: any[]; onSwitchToInfer: () => void }) {
  // steps: upload → config → progress → results
  const [step, setStep] = useState<"upload" | "config" | "progress" | "results">("upload");

  // upload state
  const [csvBytes, setCsvBytes] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [fileErr, setFileErr] = useState<string | null>(null);

  // config state
  const [targetCol, setTargetCol] = useState("");
  const [taskType, setTaskType] = useState("auto");

  // job polling state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [trainErr, setTrainErr] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleReset = () => {
    setCsvBytes(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setTargetCol("");
    setJobId(null);
    setJobStatus(null);
    setResults(null);
    setTrainErr(null);
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("upload");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileErr(null);
    if (!f.name.endsWith(".csv")) return setFileErr("Only CSV files are accepted.");
    if (f.size > 5 * 1024 * 1024) return setFileErr("File exceeds 5 MB limit.");
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return setFileErr("CSV has no data rows.");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"|'/g, ""));
      const rows = lines.slice(1, 6).map(line => {
        const vals = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || "").trim().replace(/"|'/g, "")]));
      });
      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvBytes(f);
      setTargetCol(headers[headers.length - 1]); // sensible default: last column
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile({ target: { files: [f] } } as any);
  };

  const startTraining = async (aggressive: boolean = false) => {
    if (!csvBytes || !targetCol) return;
    setTrainErr(null);
    setStep("progress");

    const form = new FormData();
    form.append("file", csvBytes);
    form.append("target_column", targetCol);
    form.append("task_type", taskType);
    form.append("aggressive", aggressive.toString());

    try {
      const res = await fetch(`${API_BASE}/train`, { method: "POST", body: form });
      if (!res.ok) { 
        const e = await res.json(); 
        const msg = typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail);
        throw new Error(msg || "Failed to start training."); 
      }
      const { job_id } = await res.json();
      setJobId(job_id);

      // Poll /status every 1.5s
      pollRef.current = setInterval(async () => {
        try {
          const sRes = await fetch(`${API_BASE}/status/${job_id}`);
          const s = await sRes.json();
          setJobStatus(s);
          if (s.status === "done") {
            clearInterval(pollRef.current!);
            const rRes = await fetch(`${API_BASE}/results/${job_id}`);
            setResults(await rRes.json());
            setStep("results");
          } else if (s.status === "failed") {
            clearInterval(pollRef.current!);
            setTrainErr(s.error || "Training failed.");
            setStep("config");
          }
        } catch (e) { /* keep polling */ }
      }, 1500);
    } catch (e: any) {
      setTrainErr(e.message);
      setStep("config");
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Render ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Pipeline Stage Breadcrumb */}
      <PipelineBreadcrumb active={step} />

      {/* ── STEP: Upload ── */}
      {step === "upload" && (
        <Panel title="Upload Dataset" subtitle="Upload your CSV — we infer column types, handle missing values, and detect cardinality automatically.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <DropZone onFile={handleFile} onDrop={handleDrop} />
              {fileErr && <Msg ok={false} text={fileErr} />}
              {csvBytes && !fileErr && (
                <Msg ok text={`${csvBytes.name} · ${csvHeaders.length} columns · loaded`} />
              )}
              {csvBytes && !fileErr && (
                <PrimaryBtn label="Continue → Configure" onClick={() => setStep("config")} />
              )}
            </div>

            {csvRows.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 12, color: C.muted, margin: 0, fontWeight: 600 }}>DATASET PREVIEW (first 5 rows)</p>
                <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <table style={{ borderCollapse: "collapse", fontSize: 11, whiteSpace: "nowrap" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}>
                        {csvHeaders.slice(0, 7).map(h => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                        ))}
                        {csvHeaders.length > 7 && <th style={{ padding: "8px 14px", color: C.dim }}>+{csvHeaders.length - 7}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          {csvHeaders.slice(0, 7).map(h => (
                            <td key={h} style={{ padding: "8px 14px", color: C.muted, fontFamily: "monospace" }}>{row[h] ?? "—"}</td>
                          ))}
                          {csvHeaders.length > 7 && <td style={{ padding: "8px 14px", color: C.dim }}>…</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ── STEP: Config ── */}
      {step === "config" && (
        <Panel title="Configure Pipeline" subtitle="Select the target column. The engine will automatically detect the task type (classification or regression), handle feature engineering, and select the optimal model.">
          <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
            {trainErr && <Msg ok={false} text={trainErr} />}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={labelStyle}>Target Column (what to predict)</label>
              <select value={targetCol} onChange={e => setTargetCol(e.target.value)} style={selectStyle}>
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* Summary card */}
            <div style={{ padding: 18, borderRadius: 12, backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "rgba(59,130,246,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Dataset Summary</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { k: "File", v: csvBytes?.name || "—" },
                  { k: "Columns", v: csvHeaders.length },
                  { k: "Target", v: targetCol || "—" },
                  { k: "Task", v: "Auto-Detecting..." },
                ].map(r => (
                  <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: C.muted }}>{r.k}</span>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <GhostBtn label="← Back" onClick={() => setStep("upload")} />
              <PrimaryBtn label="Build ML Pipeline" onClick={startTraining} disabled={!targetCol} />
            </div>
          </div>
        </Panel>
      )}

      {/* ── STEP: Progress ── */}
      {step === "progress" && (
        <Panel title="Building Pipeline" subtitle="The autonomous engine is running. Each stage updates in real time.">
          <div style={{ maxWidth: 560 }}>
            {/* Overall progress bar */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: C.muted }}>{jobStatus?.stage || "Starting…"}</span>
                <span style={{ color: C.blue, fontWeight: 700 }}>{jobStatus?.progress ?? 0}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, backgroundColor: C.blue, width: `${jobStatus?.progress ?? 0}%`, transition: "width 0.6s ease" }} />
              </div>
            </div>

            {/* Stage list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {STAGE_LABELS.map((label, i) => {
                const currentStep = jobStatus?.step ?? 0;
                const done = i < currentStep;
                const active = i === currentStep - 1 && jobStatus?.status === "running";
                const pending = i >= currentStep;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, backgroundColor: active ? "rgba(59,130,246,0.06)" : "transparent", border: active ? "1px solid rgba(59,130,246,0.15)" : "1px solid transparent", transition: "all 0.3s" }}>
                    <StageIcon done={done} active={active} index={i} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 700 : 500, color: done ? C.green : active ? "#fff" : C.dim }}>
                        [{i + 1}/{STAGE_LABELS.length}] {label}
                      </p>
                    </div>
                    {done && <CheckCircle2 style={{ width: 16, height: 16, color: C.green, flexShrink: 0 }} />}
                    {active && <Spinner />}
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      {/* ── STEP: Results ── */}
      {step === "results" && results && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Success banner + CTAs */}
          <div style={{ padding: "16px 24px", borderRadius: 14, backgroundColor: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle2 style={{ width: 20, height: 20, color: C.green }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: C.green }}>Training Complete</p>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                  {results.model_name} · {results.task_type} · {results.n_features} features · {results.training_time_sec}s
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {results && !results.aggressive && (
                ((results.metrics?.F1_Score != null && results.metrics.F1_Score < 0.85) || 
                 (results.metrics?.R2_Score != null && results.metrics.R2_Score < 0.85))
              ) && <BoostBtn onClick={() => startTraining(true)} />}
              
              <GhostBtn label="⟲ Train New Dataset" onClick={handleReset} />
              <DownloadBtn format="joblib" modelName={results.model_name} taskType={results.task_type} />
              <DownloadBtn format="pkl" modelName={results.model_name} taskType={results.task_type} />
              <PrimaryBtn label="⚡ Switch to Inference →" onClick={onSwitchToInfer} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Metrics */}
            <Panel title="Model Results" subtitle={`Trained in ${results.training_time_sec}s on ${results.n_samples} rows`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <MetricCard label="Model Selected" value={results.model_name} accent={C.blue} />
                {results.metrics?.R2_Score != null && <MetricCard label="R² Score" value={results.metrics.R2_Score.toFixed(3)} accent={C.green} />}
                {results.metrics?.MAE != null && <MetricCard label="MAE" value={results.metrics.MAE.toFixed(4)} accent={C.yellow} />}
                {results.metrics?.RMSE != null && <MetricCard label="RMSE" value={results.metrics.RMSE.toFixed(4)} />}
                {results.metrics?.F1_Score != null && <MetricCard label="F1 Score" value={results.metrics.F1_Score.toFixed(3)} accent={C.green} />}
                {results.metrics?.ROC_AUC != null && <MetricCard label="ROC-AUC" value={results.metrics.ROC_AUC.toFixed(3)} accent={C.green} />}
                {results.metrics?.Precision != null && <MetricCard label="Precision" value={results.metrics.Precision.toFixed(3)} />}
                {results.metrics?.Recall != null && <MetricCard label="Recall" value={results.metrics.Recall.toFixed(3)} />}
                <MetricCard label="Training Time" value={`${results.training_time_sec}s`} />
                <MetricCard label="Features" value={results.n_features} />
              </div>
            </Panel>


            {/* Feature Importance */}
            <Panel title="Feature Importance" subtitle="Mean |SHAP| across training sample">
              {Object.keys(results.feature_importance || {}).length > 0 ? (
                <div style={{ height: 280, width: "100%", minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={Object.entries(results.feature_importance).map(([k, v]) => ({ name: k.split("__").pop()?.toUpperCase() ?? k, val: v as number }))}
                      layout="vertical"
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11 }} />
                      <Bar dataKey="val" fill={C.blue} radius={[0, 5, 5, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon="📊" text="Feature importance unavailable (SHAP explainer may not have loaded)." />
              )}
            </Panel>
          </div>

          {/* ── Diagnostic Report Row ── */}
          {results.suggestions && results.suggestions.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Panel 
                title="AI Diagnostic Report" 
                subtitle="The automated engine has identified potential bottlenecks in your dataset."
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {results.suggestions.map((s: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 14, padding: "16px 20px", backgroundColor: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 12, alignItems: "flex-start" }}>
                      <AlertTriangle style={{ width: 20, height: 20, color: C.yellow, flexShrink: 0, marginTop: 2 }} />
                      <p style={{ margin: 0, fontSize: 13, color: "#fff", lineHeight: 1.6, fontWeight: 500 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* ── Charts Row ── */}
          {results.plots && (
            <div style={{ marginTop: 20 }}>
              <Panel 
                title={results.plots.type === 'confusion_matrix' ? "Error Analysis (Confusion Matrix)" : "Model Calibration (Actual vs Predicted)"} 
                subtitle={results.plots.type === 'confusion_matrix' ? "Detailed breakdown of correct predictions vs misclassifications." : "Visualization of prediction error and variance."}
              >
                {results.plots.type === 'confusion_matrix' ? (
                  <ConfusionMatrix labels={results.plots.labels} matrix={results.plots.matrix} />
                ) : (
                  <RegressionChart data={results.plots.data} />
                )}
              </Panel>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────── INFERENCE MODE ──────────
type FeatureSpec = { type: "number" | "text"; values: string[] | null; sample: any };
type Metadata    = { available: boolean; features?: Record<string, FeatureSpec>; task_type?: string; model_name?: string; target_col?: string };

function InferMode({ alerts, onSwitchToTrain, isActive }: { alerts: any[]; onSwitchToTrain: () => void; isActive: boolean }) {
  const [metadata, setMetadata]       = useState<Metadata | null>(null);
  const [formData, setFormData]       = useState<Record<string, any>>({});
  const [prediction, setPrediction]   = useState<any>(null);
  const [shap, setShap]               = useState<Record<string, number> | null>(null);
  const [feedbackId, setFeedbackId]   = useState("");
  const [feedbackLabel, setFeedbackLabel] = useState("0");
  const [feedbackMsg, setFeedbackMsg] = useState<"success" | "error" | null>(null);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState<"prediction" | "shap" | "feedback" | "alerts">("prediction");

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/metadata`);
      if (!res.ok) return;
      const meta: Metadata = await res.json();
      setMetadata(meta);
      if (meta.available && meta.features) {
        setFormData(prev => {
          const init: Record<string, any> = {};
          Object.entries(meta.features!).forEach(([col, spec]) => {
            // keep existing user values, only seed new keys
            init[col] = prev[col] !== undefined ? prev[col] : (spec.sample ?? (spec.type === "number" ? 0 : ""));
          });
          return init;
        });
      }
    } catch { setMetadata({ available: false }); }
  }, []);

  // Fetch on mount AND set up a short re-poll until model is available
  useEffect(() => {
    if (!isActive) return;
    fetchMetadata();
    // If no metadata yet, retry every 2s for up to 20s
    let retries = 0;
    const iv = setInterval(() => {
      retries++;
      if (retries > 10) { clearInterval(iv); return; }
      fetch(`${API_BASE}/metadata`)
        .then(r => r.json())
        .then((meta: Metadata) => {
          if (meta.available) {
            setMetadata(meta);
            if (meta.features) {
              const init: Record<string, any> = {};
              Object.entries(meta.features).forEach(([col, spec]) => {
                init[col] = spec.sample ?? (spec.type === "number" ? 0 : "");
              });
              setFormData(init);
            }
            clearInterval(iv);
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(iv);
  }, [fetchMetadata, isActive]);

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

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request_ids: [feedbackId], truths: [Number(feedbackLabel)] }) });
      setFeedbackMsg(res.ok ? "success" : "error");
    } catch { setFeedbackMsg("error"); }
  };

  const shapData = shap ? Object.entries(shap).map(([k, v]) => ({ name: k.split("__").pop()?.toUpperCase() ?? k, val: v })).sort((a, b) => Math.abs(b.val) - Math.abs(a.val)).slice(0, 8) : [];
  const featureEntries = metadata?.features ? Object.entries(metadata.features) : [];
  const isRegression   = metadata?.task_type === "regression";

  const tabs = [
    { id: "prediction" as const, label: "Inference", icon: <Activity style={{ width: 14, height: 14 }} /> },
    { id: "shap" as const, label: "SHAP", icon: "🧠" },
    { id: "feedback" as const, label: "Feedback", icon: "🔁" },
    { id: "alerts" as const, label: `Alerts${alerts.length > 0 ? ` (${alerts.length})` : ""}`, icon: <AlertTriangle style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Model badge */}
      <div style={{ padding: "12px 18px", borderRadius: 12, backgroundColor: metadata?.available ? "rgba(52,211,153,0.05)" : "rgba(59,130,246,0.05)", border: `1px solid ${metadata?.available ? "rgba(52,211,153,0.15)" : "rgba(59,130,246,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
          {metadata === null
            ? "Loading model info…"
            : metadata.available
              ? <><strong style={{ color: "#fff" }}>{metadata.model_name}</strong> · <span style={{ color: C.green }}>{metadata.task_type}</span> · target: <code style={{ color: C.blue }}>{metadata.target_col}</code></>
              : "No model loaded. Train a model first."}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {!metadata?.available && <GhostBtn label="↺ Reload" onClick={fetchMetadata} />}
          <GhostBtn label="Go to Train →" onClick={onSwitchToTrain} />
        </div>
      </div>


      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map(t => <TabBtn key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} hasAlert={t.id === "alerts" && alerts.length > 0} />)}
      </div>

      {/* ── Inference Tab ── */}
      {activeTab === "prediction" && (
        <Panel title="Prediction Engine" subtitle={metadata?.available ? `Predicting: ${metadata.target_col} | Model: ${metadata.model_name}` : "Train a model to enable predictions."}>
          {!metadata?.available || featureEntries.length === 0 ? (
            <EmptyState icon="🤖" text="No model loaded yet. Go to Train Mode, upload your CSV, and build the pipeline first." cta="Go to Train →" onCta={onSwitchToTrain} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {featureEntries.map(([col, spec]) => (
                    <DynamicField
                      key={col}
                      col={col}
                      spec={spec}
                      value={formData[col] ?? spec.sample ?? ""}
                      onChange={v => setFormData(p => ({ ...p, [col]: spec.type === "number" ? (isNaN(Number(v)) ? v : Number(v)) : v }))}
                    />
                  ))}
                </div>
                <RunBtn loading={loading} onClick={handlePredict} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ResultBox prediction={prediction} isRegression={isRegression} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <StatBox label="Inference Speed" value="< 10ms" sub="P95 latency" />
                  <StatBox label="RAM Budget" value="< 1 GB" sub="Footprint" />
                </div>
                {prediction && !isRegression && <ActionBtn onClick={() => setActiveTab("shap")} label="View SHAP Explanations →" />}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* SHAP */}
      {activeTab === "shap" && (
        <Panel title="Feature Explanations (SHAP)" subtitle="Green = toward approval · Red = toward rejection">
          {shapData.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
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
              <SHAPTable shap={shap!} />
            </div>
          ) : (
            <EmptyState icon="🧠" text="No SHAP data. Run inference first." cta="Go to Inference →" onCta={() => setActiveTab("prediction")} />
          )}
        </Panel>
      )}

      {/* Feedback */}
      {activeTab === "feedback" && (
        <Panel title="Feedback Reconciliation" subtitle="Submit delayed ground truth labels by request ID.">
          <div style={{ maxWidth: 480 }}>
            <form onSubmit={handleFeedback} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Request ID" value={feedbackId} onChange={setFeedbackId} placeholder="e.g. web-req-1712345678" type="text" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>True Label</label>
                <select value={feedbackLabel} onChange={e => setFeedbackLabel(e.target.value)} style={selectStyle}>
                  <option value="0">0 — Approved (No Default)</option>
                  <option value="1">1 — Rejected (Default)</option>
                </select>
              </div>
              <GhostBtn label="Submit Feedback" type="submit" />
              {feedbackMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: feedbackMsg === "success" ? C.green : C.red }}>
                  {feedbackMsg === "success" ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
                  {feedbackMsg === "success" ? "Feedback logged successfully." : "Failed. Check API."}
                </div>
              )}
            </form>
          </div>
        </Panel>
      )}

      {/* Alerts */}
      {activeTab === "alerts" && (
        <Panel title="Drift Sentinel" subtitle="Live KS-Test + Chi-Square monitoring · auto-polls every 5s" badge={alerts.length > 0 ? `${alerts.length} active` : "Clear"} badgeColor={alerts.length > 0 ? C.yellow : C.green}>
          {alerts.length === 0 ? (
            <EmptyState icon="✅" text="No drift detected. Distributions are within bounds." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.slice().reverse().map((a, i) => <AlertCard key={i} alert={a} />)}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────── Shared Components ────────────

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" };
const selectStyle: React.CSSProperties = { height: 42, padding: "0 14px", backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", cursor: "pointer" };

function PipelineBreadcrumb({ active }: { active: string }) {
  const steps = [
    { id: "upload", label: "Upload" },
    { id: "config", label: "Configure" },
    { id: "progress", label: "Training" },
    { id: "results", label: "Results" },
  ];
  const activeIdx = steps.findIndex(s => s.id === active);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      {steps.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${i <= activeIdx ? C.blue : C.border}`, backgroundColor: i < activeIdx ? C.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: i <= activeIdx ? (i < activeIdx ? "#fff" : C.blue) : C.dim, transition: "all 0.3s" }}>
              {i < activeIdx ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === activeIdx ? 700 : 400, color: i === activeIdx ? "#fff" : i < activeIdx ? C.muted : C.dim, transition: "color 0.3s" }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight style={{ width: 14, height: 14, color: C.dim }} />}
        </div>
      ))}
    </div>
  );
}

function StageIcon({ done, active, index }: { done: boolean; active: boolean; index: number }) {
  if (done) return <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.green, flexShrink: 0 }}>{index + 1}</div>;
  if (active) return <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(59,130,246,0.2)", border: "2px solid rgba(59,130,246,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.blue, flexShrink: 0 }}>{index + 1}</div>;
  return <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.dim, flexShrink: 0 }}>{index + 1}</div>;
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.3)", borderTopColor: C.blue, flexShrink: 0, animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: accent || "#fff", letterSpacing: "-0.01em" }}>{value}</span>
    </div>
  );
}

function SHAPTable({ shap }: { shap: Record<string, number> }) {
  return (
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
          {Object.entries(shap).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).map(([key, val]) => {
            const pct = Math.min(Math.abs(val) * 600, 100);
            return (
              <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 10, color: C.muted }}>{key}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: val > 0 ? C.green : C.red }}>{val > 0 ? "+" : ""}{val.toFixed(4)}</td>
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  <div style={{ width: 64, height: 4, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginLeft: "auto" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, backgroundColor: val > 0 ? C.green : C.red }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DropZone({ onFile, onDrop }: { onFile: (e: React.ChangeEvent<HTMLInputElement>) => void; onDrop: (e: React.DragEvent) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <label htmlFor="csv-upload"
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { setDrag(false); onDrop(e); }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, height: 180, borderRadius: 16, border: `2px dashed ${drag ? C.blue : C.border}`, backgroundColor: drag ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "all 0.2s" }}>
      <Upload style={{ width: 32, height: 32, color: drag ? C.blue : C.muted }} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 15, color: drag ? C.blue : C.muted, margin: 0, fontWeight: 600 }}>Drop CSV file here or click to browse</p>
        <p style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>Max 5 MB · CSV only · 50k rows</p>
      </div>
      <input type="file" accept=".csv" onChange={onFile} style={{ display: "none" }} id="csv-upload" />
    </label>
  );
}

function Panel({ title, subtitle, badge, badgeColor, children }: { title: string; subtitle?: string; badge?: string; badgeColor?: string; children: React.ReactNode }) {
  return (
    <section style={{ borderRadius: 20, border: `1px solid ${C.border}`, backgroundColor: C.card, overflow: "hidden" }}>
      <div style={{ padding: "22px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.55, maxWidth: 640 }}>{subtitle}</p>}
        </div>
        {badge && <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: "1px solid", borderColor: badgeColor || C.border, color: badgeColor || C.muted, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>{badge}</span>}
      </div>
      <div style={{ padding: 28 }}>{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
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

function PrimaryBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 44, padding: "0 24px", backgroundColor: disabled ? "rgba(255,255,255,0.05)" : hov ? "#60a5fa" : C.blue, border: "none", borderRadius: 12, color: disabled ? C.dim : "#fff", fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: hov && !disabled ? "0 8px 24px rgba(59,130,246,0.3)" : "none", transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)" }}>
      {label}
    </button>
  );
}

function BoostBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 44, padding: "0 24px", backgroundColor: hov ? "#f97316" : "#ea580c", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", boxShadow: hov ? "0 8px 24px rgba(234,88,12,0.4)" : "none", transform: hov ? "translateY(-1px)" : "translateY(0)", display: "flex", alignItems: "center", gap: 8 }}>
      <Activity style={{ width: 18, height: 18 }} />
      🚀 Boost Accuracy
    </button>
  );
}

function GhostBtn({ label, onClick, type }: { label: string; onClick?: () => void; type?: "button" | "submit" }) {
  const [hov, setHov] = useState(false);
  return (
    <button type={type || "button"} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ height: 40, padding: "0 18px", backgroundColor: hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${hov ? "rgba(255,255,255,0.18)" : C.border}`, borderRadius: 10, color: hov ? "#fff" : C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
      {label}
    </button>
  );
}

function DownloadBtn({ format, modelName, taskType }: { format: "joblib" | "pkl"; modelName: string; taskType: string }) {
  const [hov, setHov] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = `${API_BASE}/download-model?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) { alert("Download failed: " + (await res.text())); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `autonomous_ml_${modelName}_${taskType}.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally { setDownloading(false); }
  };

  return (
    <button onClick={handleDownload} disabled={downloading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "10px 16px", backgroundColor: hov ? "rgba(52,211,153,0.1)" : "transparent", border: `1px solid ${hov ? C.green : "rgba(52,211,153,0.3)"}`, borderRadius: 10, color: hov ? C.green : "rgba(52,211,153,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
      {downloading ? "..." : `⬇ .${format}`}
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

function DynamicField({ col, spec, value, onChange }: {
  col: string;
  spec: { type: "number" | "text"; values: string[] | null; sample: any };
  value: any;
  onChange: (v: string) => void;
}) {
  const label = col.replace(/_/g, " ");
  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    backgroundColor: "#1a1a1a", border: `1px solid ${C.border}`,
    color: "#fff", fontSize: 13, boxSizing: "border-box",
    outline: "none",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</label>
      {spec.values && spec.values.length > 0 ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inp }}>
          {spec.values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      ) : (
        <input
          type={spec.type === "number" ? "number" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          step={spec.type === "number" ? "any" : undefined}
          style={inp}
        />
      )}
    </div>
  );
}

function ResultBox({ prediction, isRegression }: { prediction: any; isRegression?: boolean }) {
  const val = prediction?.predictions?.[0];
  const isNull = val === undefined || val === null;
  let display = "";
  let color = C.blue;
  if (!isNull) {
    if (isRegression) {
      display = typeof val === "number" ? val.toFixed(4) : String(val);
      color = C.blue;
    } else {
      display = val === 0 ? "CLASS 0" : val === 1 ? "CLASS 1" : String(val);
      color = val === 0 ? C.green : C.red;
    }
  }
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, backgroundColor: C.card, minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 16 }}>
      {!isNull ? (<>
        <p style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>Prediction</p>
        <p style={{ fontSize: isRegression ? 32 : 38, fontWeight: 900, color, margin: 0, letterSpacing: "-0.02em", wordBreak: "break-all" }}>{display}</p>
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

function EmptyState({ icon, text, cta, onCta }: { icon: string; text: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ fontSize: 14, color: C.muted, maxWidth: 360, lineHeight: 1.65, margin: 0 }}>{text}</p>
      {cta && onCta && <GhostBtn label={cta} onClick={onCta} />}
    </div>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: ok ? C.green : C.red }}>
      {ok ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
      {text}
    </div>
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

function ModeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s", backgroundColor: active ? C.blue : hov ? "rgba(255,255,255,0.06)" : "transparent", color: active ? "#fff" : hov ? "rgba(255,255,255,0.7)" : C.muted, boxShadow: active ? "0 4px 14px rgba(59,130,246,0.25)" : "none" }}>
      {icon} {label}
    </button>
  );
}

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
      style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: hov ? "rgba(255,255,255,0.8)" : C.muted, transition: "all 0.2s", backgroundColor: hov ? "rgba(255,255,255,0.06)" : "transparent" }}>
      <RefreshCcw style={{ width: 14, height: 14 }} />
    </button>
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
