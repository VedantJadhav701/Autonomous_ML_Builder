"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Activity, Cpu, Shield, Zap, Database, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-black italic shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              A
            </div>
            <span className="text-lg font-black italic tracking-tight group-hover:text-blue-400 transition-colors">AutoStack</span>
          </Link>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-500">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
              <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" className="flex items-center gap-1 hover:text-white transition-colors">
                <ExternalLink className="w-3 h-3" /> GitHub
              </a>
            </div>
            <Link 
              href="/login" 
              className="px-5 h-10 bg-blue-600 text-white rounded-xl text-sm font-black italic flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Launch App <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Background Video (Starting Screen Only) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover opacity-30"
          >
            <source src="/background_video.mov" type="video/quicktime" />
            <source src="/background_video.mov" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        </div>

        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-40 right-0 w-[500px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
            Enterprise AutoML Framework
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.9] text-white">
            The Zero-Config <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 animate-gradient">
              ML Stack.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 font-medium leading-relaxed">
            Production-grade ML lifecycle system with real-time drift detection, SHAP explainability, and autonomous pipeline synthesis. Built for high-stakes environments.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/login" 
              className="w-full md:w-auto px-10 h-14 bg-blue-600 text-white rounded-2xl text-lg font-black italic flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95"
            >
              Start Building <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" 
              target="_blank"
              className="w-full md:w-auto px-10 h-14 bg-white/[0.03] border border-white/10 text-white rounded-2xl text-lg font-black italic flex items-center justify-center gap-3 hover:bg-white/[0.06] transition-all"
            >
              <ExternalLink className="w-5 h-5" /> View Source
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 max-w-4xl mx-auto border-t border-white/5 mt-20">
            {[
              { val: "< 10ms", label: "P95 Latency" },
              { val: "Auto", label: "Pipeline" },
              { val: "50k", label: "Rows / Load" },
              { val: "KS + χ²", label: "Drift Tests" }
            ].map(s => (
              <div key={s.label} className="space-y-1">
                <p className="text-3xl font-black italic tracking-tight">{s.val}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic tracking-tight">Core Modules</h2>
            <p className="text-zinc-500 font-medium max-w-xl italic">AutoStack automates the entire machine learning lifecycle, from data profiling to live production monitoring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Database, title: "Data Ingestion", desc: "Auto-selects between One-Hot and Ordinal encoding based on cardinality and entropy.", color: "text-blue-500" },
              { icon: Cpu, title: "Stacking Ensemble", desc: "Combines XGBoost, CatBoost, and LightGBM with a Meta-Learner for peak accuracy.", color: "text-purple-500" },
              { icon: Activity, title: "Drift Monitor", desc: "Real-time statistical testing detects 'silent failures' before they impact your business.", color: "text-amber-500" },
              { icon: Shield, title: "Guardrail Layer", desc: "LLM-assisted structural planning ensures model architecture respects your data constraints.", color: "text-emerald-500" },
              { icon: BarChart3, title: "SHAP Explainers", desc: "Every prediction comes with a global contribution analysis. Know exactly why the model made a choice.", color: "text-blue-400" },
              { icon: Zap, title: "Instant Inference", desc: "Unified joblib pipelines pre-loaded at boot. Zero cold-start latency for mission-critical apps.", color: "text-yellow-400" },
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-[32px] bg-white/[0.01] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                <f.icon className={`w-8 h-8 ${f.color} mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6`} />
                <h3 className="text-xl font-black italic tracking-tight mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-black italic">A</div>
             <span className="text-xs font-black italic tracking-tighter text-zinc-500">AutoStack v2.0.0</span>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">
            <a href="#" className="hover:text-zinc-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Changelog</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Legal</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
          </div>
          
          <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">
            Built by Vedant Jadhav
          </p>
        </div>
      </footer>
    </div>
  );
}
