import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <Features />

      {/* ARCHITECTURE SECTION */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">System Design</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Architecture
            </h2>
          </div>

          {/* Diagram */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-8 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max text-sm font-mono">
              {[
                { label: "User", color: "bg-blue-500" },
                { label: "FastAPI", color: "bg-gray-700" },
                { label: "Pipeline", color: "bg-gray-700" },
                { label: "Model", color: "bg-gray-700" },
                { label: "Drift Monitor", color: "bg-yellow-600" },
                { label: "Feedback Log", color: "bg-gray-700" },
                { label: "Alerts", color: "bg-red-600" },
              ].map((node, i, arr) => (
                <div key={node.label} className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-lg text-white text-xs font-bold ${node.color}`}>
                    {node.label}
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-gray-600 font-light">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* API endpoints reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { method: "POST", path: "/predict", desc: "Batch inference — returns class predictions + request IDs" },
              { method: "POST", path: "/explain", desc: "SHAP feature contributions for each input row" },
              { method: "POST", path: "/feedback", desc: "Reconcile delayed ground truth labels to request IDs" },
              { method: "GET", path: "/health", desc: "Pipeline and explainer readiness status" },
              { method: "GET", path: "/alerts", desc: "Drift alerts history from the Sentinel Monitor" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-start gap-4 p-4 rounded-lg border border-gray-800 bg-gray-900/20">
                <span className={`text-[10px] font-black px-2 py-1 rounded shrink-0 ${ep.method === "POST" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                  {ep.method}
                </span>
                <div>
                  <code className="text-xs font-mono text-white">{ep.path}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto rounded-2xl border border-gray-700 bg-gray-900/50 p-12 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Ready to test the system?
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Run live inference, inspect SHAP explanations, inject drift signals, and monitor the full ML lifecycle.
          </p>
          <Link
            href="/app"
            className="inline-block px-10 py-4 bg-blue-500 hover:bg-blue-400 transition-colors rounded-xl text-sm font-bold text-white"
          >
            Launch App →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
