import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-40 pb-28 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-700 text-gray-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          v1.0.0 — Production Release
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
            Autonomous ML Builder
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl leading-relaxed">
            Production-grade ML system with real-time drift detection,
            SHAP explainability, and auto pipeline design. Built for
            resource-constrained environments.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/app"
            className="px-8 py-4 bg-blue-500 hover:bg-blue-400 transition-colors rounded-xl text-sm font-bold text-white"
          >
            Launch App →
          </Link>
          <a
            href="https://github.com/VedantJadhav701/Autonomous_ML_Builder"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 border border-gray-700 hover:border-gray-500 transition-colors rounded-xl text-sm font-bold text-gray-300 hover:text-white"
          >
            View GitHub
          </a>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-8 pt-8 border-t border-gray-800">
          <Stat value="< 10ms" label="Inference P95" />
          <Stat value="< 1 GB" label="RAM Footprint" />
          <Stat value="50k" label="Max Dataset Rows" />
          <Stat value="KS + χ²" label="Drift Tests" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}
