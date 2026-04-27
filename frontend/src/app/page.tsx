"use client";

import React from "react";
import StatusIndicator from "@/components/StatusIndicator";
import UploadSection from "@/components/UploadSection";
import PredictionSection from "@/components/PredictionSection";
import ExplainSection from "@/components/ExplainSection";
import FeedbackSection from "@/components/FeedbackSection";

export default function MinimalDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 min-h-screen font-sans antialiased text-slate-900 dark:text-slate-100 bg-white dark:bg-black">
      {/* HEADER */}
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Autonomous ML Builder</h1>
          <p className="text-sm text-slate-500">Operational Lifecycle Console</p>
        </div>
        <StatusIndicator />
      </header>

      {/* CORE CONTENT GRID */}
      <main className="space-y-16">
        <UploadSection />
        
        <div className="h-[1px] bg-slate-100 dark:bg-zinc-800" />
        
        <PredictionSection />
        
        <div className="h-[1px] bg-slate-100 dark:bg-zinc-800" />
        
        <ExplainSection />
        
        <div className="h-[1px] bg-slate-100 dark:bg-zinc-800" />
        
        <FeedbackSection />
      </main>

      {/* FOOTER */}
      <footer className="pt-12 border-t text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
        Production Environment • v1.0.0 • No External Dependencies
      </footer>
    </div>
  );
}
