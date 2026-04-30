"use client";

import Link from "next/link";
import { Database, Cpu, Zap, BarChart3, ArrowUpRight } from "lucide-react";

const STUDIO_CARDS = [
  {
    title: "Clean Data",
    subtitle: "Make your dataset gold standard.",
    icon: Database,
    href: "/studio/clean",
    color: "from-blue-600/20 to-blue-600/5",
    iconColor: "text-blue-500",
    shadow: "hover:shadow-blue-500/10"
  },
  {
    title: "Train Model",
    subtitle: "Run parallel models & stacking.",
    icon: Cpu,
    href: "/studio/train",
    color: "from-purple-600/20 to-purple-600/5",
    iconColor: "text-purple-500",
    shadow: "hover:shadow-purple-500/10"
  },
  {
    title: "Inference",
    subtitle: "Run predictions on live data.",
    icon: Zap,
    href: "/studio/inference",
    color: "from-amber-600/20 to-amber-600/5",
    iconColor: "text-amber-500",
    shadow: "hover:shadow-amber-500/10"
  },
  {
    title: "Model Visualization",
    subtitle: "Analyze performance metrics.",
    icon: BarChart3,
    href: "/studio/visualize",
    color: "from-emerald-600/20 to-emerald-600/5",
    iconColor: "text-emerald-500",
    shadow: "hover:shadow-emerald-500/10"
  },
];

export default function StudioDashboard() {
  return (
    <div className="space-y-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic tracking-tight">Studio Dashboard</h1>
        <p className="text-zinc-500 font-medium">Monitor your autonomous ML lifecycle and manage active pipelines.</p>
      </div>

      {/* ── Top Section: History & Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dataset History */}
        <div className="lg:col-span-2 p-8 rounded-[40px] border border-white/5 bg-white/[0.01] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold italic">Dataset History</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Recent Uploads</span>
          </div>
          
          <div className="space-y-3">
            {[
              { name: "customer_churn_v2.csv", size: "14.2 MB", date: "2m ago", status: "Cleaned" },
              { name: "options_pricing_v1.csv", size: "8.1 MB", date: "1h ago", status: "Training" },
              { name: "user_engagement.csv", size: "22.5 MB", date: "4h ago", status: "Analyzed" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                    <Database className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">{item.name}</p>
                    <p className="text-[10px] font-medium text-zinc-600 italic">{item.size} · {item.date}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider text-blue-400">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Metrics */}
        <div className="p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent space-y-8 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold italic">Global Performance</h3>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Aggregated Across 12 Models</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-4xl font-black italic tracking-tighter">98.4%</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Avg Accuracy</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-black italic tracking-tighter">12ms</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">P95 Latency</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center gap-3">
             <div className="flex -space-x-2">
               {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-[#0a0a0a]" />)}
             </div>
             <p className="text-[10px] font-bold text-zinc-500 italic">3 teams active</p>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Module Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Clean Data", sub: "Data Prep & EDA", icon: Database, color: "text-blue-500", href: "/studio/clean" },
          { title: "Train Model", sub: "AutoML Synthesis", icon: Cpu, color: "text-purple-500", href: "/studio/train" },
          { title: "Results", sub: "Audit & SHAP", icon: BarChart3, color: "text-emerald-500", href: "/studio/visualize" },
          { title: "Inference", sub: "Live Predictions", icon: Zap, color: "text-amber-500", href: "/studio/inference" },
        ].map((card) => (
          <Link 
            key={card.href}
            href={card.href}
            className="p-8 rounded-[32px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all group relative overflow-hidden"
          >
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <h3 className="font-bold italic tracking-tight">{card.title}</h3>
                <p className="text-xs text-zinc-600 font-medium">{card.sub}</p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/5 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
