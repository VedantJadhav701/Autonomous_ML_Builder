import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

const FEATURES = [
  { icon: "⚙️", title: "Adaptive Pipeline Engine", desc: "Auto-selects between LogisticRegression, RandomForest, and LightGBM based on dataset size and cardinality. Cardinality-aware encoding built in." },
  { icon: "📊", title: "Real-Time Drift Detection", desc: "Kolmogorov-Smirnov for numerical + Chi-Square for categorical. Rate-limited alerts fire per request — no noise." },
  { icon: "⚡", title: "Sub-10ms Inference", desc: "Unified joblib pipelines pre-loaded at boot. Zero cold-start penalty. P95 under 10ms on shared CPU cores." },
  { icon: "🧠", title: "Operationalized SHAP", desc: "MD5-cached SHAP explanations per request. Handles binary classification multi-dimensional arrays with a hard 50-row OOM guard." },
  { icon: "🔁", title: "Async Feedback Loop", desc: "Delayed ground-truth reconciliation via request IDs. Continuously evaluates live F1 scores without blocking inference." },
  { icon: "🛡️", title: "LLM Structural Planner", desc: "Guardrailed LLM override layer for architecture decisions. Every decision logged with a rationale — fully auditable." },
];

const ARCH_NODES = ["User", "FastAPI", "Pipeline", "Model", "Drift Monitor", "Feedback Log", "Alerts"];

const ENDPOINTS = [
  { method: "POST", path: "/predict",  desc: "Batch inference — class predictions + request IDs" },
  { method: "POST", path: "/explain",  desc: "SHAP feature contributions (cached, max 50 rows)" },
  { method: "POST", path: "/feedback", desc: "Reconcile delayed ground truth labels by request ID" },
  { method: "GET",  path: "/health",   desc: "Pipeline + explainer readiness check" },
  { method: "GET",  path: "/alerts",   desc: "Drift alert history from Sentinel monitor" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}>

      {/* ── Navbar ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64, borderBottom: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(10,10,10,0.9)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg text-white font-black text-xs" style={{ width: 32, height: 32, backgroundColor: "#3b82f6" }}>ML</div>
            <span className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>Autonomous ML Builder</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.45)" }}>
              <ExternalLink className="w-4 h-4" /> GitHub
            </a>
            <Link href="/app" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#3b82f6" }}>
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6" style={{ paddingTop: 160, paddingBottom: 96 }}>
        <div className="max-w-5xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          <div className="inline-flex items-center gap-2 rounded-full text-xs font-medium" style={{ padding: "6px 14px", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", width: "fit-content" }}>
            <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: "#22c55e" }} />
            v1.0.0 — Production Release
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
            <h1 className="font-black tracking-tight" style={{ fontSize: 56, lineHeight: 1.05, color: "#ffffff" }}>
              Autonomous ML Builder
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", maxWidth: 600 }}>
              Production-grade ML lifecycle system with real-time drift detection, SHAP explainability, and auto pipeline design. Built for resource-constrained environments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/app" className="inline-flex items-center gap-2 font-semibold text-sm text-white rounded-xl transition-colors" style={{ padding: "14px 24px", backgroundColor: "#3b82f6" }}>
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-sm rounded-xl transition-colors" style={{ padding: "14px 24px", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
              <ExternalLink className="w-4 h-4" /> View Source
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6" style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[{ val: "< 10ms", label: "P95 Latency" }, { val: "< 1 GB", label: "RAM Footprint" }, { val: "50,000", label: "Max Dataset Rows" }, { val: "KS + χ²", label: "Drift Tests" }].map(s => (
              <div key={s.label}>
                <p className="font-black tracking-tight" style={{ fontSize: 24, color: "#ffffff" }}>{s.val}</p>
                <p className="font-medium uppercase tracking-wider" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6" style={{ paddingTop: 80, paddingBottom: 80, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div>
            <p className="font-semibold uppercase" style={{ fontSize: 11, color: "#3b82f6", letterSpacing: "0.15em", marginBottom: 12 }}>Capabilities</p>
            <h2 className="font-black tracking-tight" style={{ fontSize: 36, color: "#ffffff" }}>What this system does</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} style={{ borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <h3 className="font-bold" style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.4 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="px-6" style={{ paddingTop: 80, paddingBottom: 80, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div>
            <p className="font-semibold uppercase" style={{ fontSize: 11, color: "#3b82f6", letterSpacing: "0.15em", marginBottom: 12 }}>System Design</p>
            <h2 className="font-black tracking-tight" style={{ fontSize: 36, color: "#ffffff" }}>Architecture</h2>
          </div>

          <div style={{ borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: 28, overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: "max-content" }}>
              {ARCH_NODES.map((node, i) => (
                <div key={node} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                    ...(node === "User" ? { backgroundColor: "#3b82f6", color: "#ffffff" }
                      : node === "Drift Monitor" ? { backgroundColor: "rgba(234,179,8,0.12)", color: "#eab308", border: "1px solid rgba(234,179,8,0.2)" }
                      : node === "Alerts" ? { backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
                      : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" })
                  }}>
                    {node}
                  </div>
                  {i < ARCH_NODES.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENDPOINTS.map(ep => (
              <div key={ep.path} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6, ...(ep.method === "POST" ? { backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa" } : { backgroundColor: "rgba(16,185,129,0.15)", color: "#34d399" }) }}>
                  {ep.method}
                </span>
                <div>
                  <code style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{ep.path}</code>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2, lineHeight: 1.5 }}>{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6" style={{ paddingTop: 80, paddingBottom: 80, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center" style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", padding: "64px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 className="font-black tracking-tight" style={{ fontSize: 36, color: "#ffffff" }}>Ready to test the system?</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 480, lineHeight: 1.7 }}>
              Run live inference, inspect SHAP explanations, inject drift signals, and monitor the full ML lifecycle.
            </p>
            <Link href="/app" className="inline-flex items-center gap-2 font-bold text-sm text-white rounded-xl" style={{ padding: "16px 32px", backgroundColor: "#3b82f6" }}>
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32, paddingBottom: 32 }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Autonomous ML Builder · v1.0.0 · MIT License · Built by Vedant Jadhav</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>GitHub</a>
            <Link href="/app" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
