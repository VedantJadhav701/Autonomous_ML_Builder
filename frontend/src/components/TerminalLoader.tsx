"use client";

import React, { useState, useEffect } from "react";

const LOGS = [
  { tag: "OK", text: "Profiling dataset...", color: "text-emerald-500" },
  { tag: "OK", text: "Synthesizing DateTime features...", color: "text-emerald-500" },
  { tag: "OK", text: "Encoding categorical high-cardinality vectors...", color: "text-emerald-500" },
  { tag: "PROCESS", text: "Scaling numerical distributions...", color: "text-blue-500" },
  { tag: "PROCESS", text: "Initializing Stacking Ensemble (XGB + LGBM)...", color: "text-blue-500" },
  { tag: "PROCESS", text: "Running 5-fold cross-validation...", color: "text-blue-500" },
  { tag: "PROCESS", text: "Tuning hyper-parameters via Bayesian Search...", color: "text-blue-500" },
  { tag: "PROCESS", text: "Executing Stacking Meta-Learner (Ridge)...", color: "text-blue-500" },
  { tag: "OK", text: "Extracting SHAP explainability matrices...", color: "text-emerald-500" },
  { tag: "SUCCESS", text: "Hardened pipeline generated.", color: "text-emerald-400 font-bold" },
];

export default function TerminalLoader() {
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < LOGS.length) {
      const timeout = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 800 + Math.random() * 1200); // Randomized delay for realism
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-black/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">AutoStack Core v2.0.1</div>
        <div className="w-10" />
      </div>

      {/* Terminal Content */}
      <div className="p-6 font-mono text-sm space-y-2 min-h-[320px] max-h-[400px] overflow-y-auto scrollbar-hide">
        {visibleLogs.map((idx) => (
          <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className={`flex-shrink-0 ${LOGS[idx].color} font-black`}>
              [{LOGS[idx].tag}]
            </span>
            <span className="text-zinc-300 italic">{LOGS[idx].text}</span>
          </div>
        ))}
        {currentIndex < LOGS.length && (
          <div className="flex gap-3">
             <span className="w-2 h-5 bg-blue-500/50 animate-pulse mt-0.5" />
          </div>
        )}
      </div>
      
      {/* Progress Info */}
      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Status</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">
             {currentIndex === LOGS.length ? "Complete" : "Optimizing..."}
           </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-700">
           {Math.round((currentIndex / LOGS.length) * 100)}%
        </div>
      </div>
    </div>
  );
}
