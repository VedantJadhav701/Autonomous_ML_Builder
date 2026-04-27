import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";

const FEATURES = [
  {
    icon: "⚙️",
    title: "Adaptive Pipeline Engine",
    desc: "Auto-selects between LogisticRegression, RandomForest, and LightGBM based on dataset size and cardinality. Cardinality-aware feature encoding built in.",
  },
  {
    icon: "📊",
    title: "Real-Time Drift Detection",
    desc: "Kolmogorov-Smirnov test for numerical features + Chi-Square for categorical. Rate-limited alerts fire per request — no noise.",
  },
  {
    icon: "⚡",
    title: "Sub-10ms Inference",
    desc: "Unified joblib pipelines pre-loaded at boot. Zero cold-start penalty. P95 under 10ms on shared CPU cores.",
  },
  {
    icon: "🧠",
    title: "Operationalized SHAP",
    desc: "MD5-cached SHAP explanations served per request. Handles binary classification multi-dimensional arrays. Hard 50-row OOM guard.",
  },
  {
    icon: "🔁",
    title: "Async Feedback Loop",
    desc: "Delayed ground-truth reconciliation via request IDs. Continuously evaluates live F1 scores without blocking inference.",
  },
  {
    icon: "🛡️",
    title: "LLM Structural Planner",
    desc: "Guardrailed LLM override layer for architectural decisions. Every decision logged with a rationale — fully auditable.",
  },
];

const ARCH_NODES = [
  "User",
  "FastAPI",
  "Pipeline",
  "Model",
  "Drift Monitor",
  "Feedback Log",
  "Alerts",
];

const ENDPOINTS = [
  { method: "POST", path: "/predict", desc: "Batch inference — returns class predictions + request IDs" },
  { method: "POST", path: "/explain", desc: "SHAP feature contributions (cached, hard-capped at 50 rows)" },
  { method: "POST", path: "/feedback", desc: "Reconcile delayed ground truth labels by request ID" },
  { method: "GET",  path: "/health",  desc: "Pipeline + explainer readiness check" },
  { method: "GET",  path: "/alerts",  desc: "Drift alert history from the Sentinel monitor" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500 flex items-center justify-center text-[10px] font-black text-white tracking-tight">
              ML
            </div>
            <span className="font-semibold text-sm text-white/90 tracking-tight">
              Autonomous ML Builder
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/VedantJadhav701/Autonomous_ML_Builder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/90 transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <Link
              href="/app"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 transition-colors text-white text-sm font-semibold rounded-lg"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-white/40 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            v1.0.0 — Production Release
          </div>

          <div className="space-y-5 max-w-3xl">
            <h1 className="text-5xl md:text-[64px] font-black tracking-tight leading-[1.05] text-white">
              Autonomous ML Builder
            </h1>
            <p className="text-lg md:text-xl text-white/50 font-normal leading-relaxed max-w-2xl">
              Production-grade ML lifecycle system with real-time drift detection,
              SHAP explainability, and auto pipeline design. Built for
              resource-constrained environments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 transition-colors text-white text-sm font-semibold rounded-xl"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/VedantJadhav701/Autonomous_ML_Builder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors text-white/70 hover:text-white text-sm font-semibold rounded-xl"
            >
              <Github className="w-4 h-4" />
              View Source
            </a>
          </div>

          <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { val: "< 10ms", label: "P95 Latency" },
              { val: "< 1 GB", label: "RAM Footprint" },
              { val: "50,000",  label: "Max Dataset Rows" },
              { val: "KS + χ²", label: "Drift Detection Tests" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white tracking-tight">{s.val}</p>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-[0.15em] mb-3">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              What this system does
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-3 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-bold text-white text-sm leading-snug">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-[0.15em] mb-3">System Design</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Architecture</h2>
          </div>

          {/* Flow diagram */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 md:p-8 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {ARCH_NODES.map((node, i) => (
                <div key={node} className="flex items-center gap-3">
                  <div
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${
                      node === "User"
                        ? "bg-blue-500 text-white"
                        : node === "Drift Monitor"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                        : node === "Alerts"
                        ? "bg-red-500/20 text-red-400 border border-red-500/20"
                        : "bg-white/5 text-white/60 border border-white/10"
                    }`}
                  >
                    {node}
                  </div>
                  {i < ARCH_NODES.length - 1 && (
                    <span className="text-white/20 text-sm">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* API reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENDPOINTS.map((ep) => (
              <div
                key={ep.path}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
              >
                <span
                  className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-md ${
                    ep.method === "POST"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  {ep.method}
                </span>
                <div>
                  <code className="text-sm font-mono text-white/80">{ep.path}</code>
                  <p className="text-xs text-white/30 mt-1 leading-relaxed">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-12 md:p-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Ready to test the system?
            </h2>
            <p className="text-white/40 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Run live inference, inspect SHAP explanations, inject drift signals,
              and monitor the full ML lifecycle in real time.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 transition-colors text-white text-sm font-bold rounded-xl"
            >
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/30">
            Autonomous ML Builder · v1.0.0 · MIT License · Built by Vedant Jadhav
          </p>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a
              href="https://github.com/VedantJadhav701/Autonomous_ML_Builder"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors"
            >
              GitHub
            </a>
            <Link href="/app" className="hover:text-white/70 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
