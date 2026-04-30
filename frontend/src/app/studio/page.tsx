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
    <div className="space-y-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic tracking-tight">Studio Dashboard</h1>
        <p className="text-zinc-500 font-medium">Select a module to begin your autonomous machine learning workflow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STUDIO_CARDS.map((card) => (
          <Link 
            key={card.href}
            href={card.href}
            className={`group relative p-8 rounded-[32px] bg-gradient-to-br ${card.color} border border-white/5 transition-all duration-300 hover:border-white/10 ${card.shadow} overflow-hidden`}
          >
            {/* Background Accent */}
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-3xl group-hover:bg-white/10 transition-colors" />
            
            <div className="relative flex flex-col h-full justify-between gap-12">
              <div className="space-y-6">
                <div className={`w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black italic tracking-tight">{card.title}</h3>
                  <p className="text-zinc-400 font-medium leading-relaxed">{card.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                <span>Enter Module</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats / Recent Activity Placeholder */}
      <div className="pt-8">
        <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold">DS</div>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-300">Active Pipelines</p>
              <p className="text-xs text-zinc-600 font-medium italic">3 models currently in production</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xl font-black italic">98.4%</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Avg Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black italic">12ms</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">P95 Latency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
