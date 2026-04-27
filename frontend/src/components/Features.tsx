const FEATURES = [
  {
    icon: "⚙️",
    title: "Adaptive Pipeline Engine",
    desc: "Automatically selects and builds an optimal ML pipeline — LogisticRegression, RandomForest, or LightGBM — based on dataset characteristics. Cardinality-aware encoding included.",
  },
  {
    icon: "📊",
    title: "Drift Detection",
    desc: "Real-time Kolmogorov-Smirnov (numerical) and Chi-Square (categorical) testing on every request. Alerts fire automatically with rate-limiting to avoid noise.",
  },
  {
    icon: "⚡",
    title: "Low Latency Inference",
    desc: "Sub-10ms P95 latency on shared CPU cores. Unified joblib pipelines are pre-loaded at API startup — zero cold-start penalty on predictions.",
  },
  {
    icon: "🧠",
    title: "SHAP Explainability",
    desc: "MD5-cached SHAP explanations for every request. Supports binary classification multi-dimensional value parsing with a hard 50-row safety cap.",
  },
  {
    icon: "🔁",
    title: "Async Feedback Loop",
    desc: "Delayed ground-truth reconciliation via request IDs. Continuously computes live F1-scores against staged predictions without blocking inference.",
  },
  {
    icon: "🛡️",
    title: "LLM Structural Planner",
    desc: "Guardrailed LLM override layer for architecture decisions (e.g., forcing time-series cross-validation). Logs every decision with rationale.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-3">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            What this system does
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-800 p-6 space-y-3 hover:border-gray-600 transition-colors bg-gray-900/30"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-bold text-white text-sm">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
