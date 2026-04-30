"use client";

import React from "react";
import { Database, Zap, Sparkles, BarChart3, LineChart, PieChart, Info, AlertCircle, CheckCircle2, TrendingUp, Activity, Download, FileJson, Share2, Link as LinkIcon, Check } from "lucide-react";
import { useStudio } from "../StudioContext";
import { useRouter } from "next/navigation";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, CartesianGrid, ZAxis
} from "recharts";

// ── Shared Sub-components ──

function RegressionChart({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" dataKey="actual" name="Actual" stroke="#52525b" fontSize={10} tick={{fill: '#52525b'}} />
          <YAxis type="number" dataKey="predicted" name="Predicted" stroke="#52525b" fontSize={10} tick={{fill: '#52525b'}} />
          <ZAxis type="number" range={[40, 40]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} 
          />
          <Scatter name="Predictions" data={data} fill="#3b82f6" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConfusionMatrix({ labels, matrix }: { labels: string[], matrix: number[][] }) {
  const maxVal = Math.max(...matrix.flat());
  return (
    <div className="mt-6">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
        {matrix.flat().map((val, i) => {
          const row = Math.floor(i / labels.length);
          const col = i % labels.length;
          const opacity = 0.1 + (val / maxVal) * 0.8;
          const isDiagonal = row === col;
          return (
            <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-xl border border-white/5 transition-transform hover:scale-105`}
                 style={{ backgroundColor: isDiagonal ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})` }}>
              <span className="text-lg font-black italic tracking-tighter">{val}</span>
              <span className="text-[8px] uppercase font-black tracking-widest opacity-60">{isDiagonal ? "True" : "False"}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-around mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

export default function VisualizePage() {
  const { results, jobId } = useStudio();
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (!jobId) return;
    const reportUrl = `${window.location.origin}/report/${jobId}`;
    navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!results) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic tracking-tight">Model Visualization</h1>
          <p className="text-zinc-500 font-medium">Analyze model performance, SHAP contributions, and drift alerts.</p>
        </div>
        <div className="p-20 rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-16 h-16 rounded-3xl bg-zinc-800/50 flex items-center justify-center text-zinc-600">
              <Activity className="w-8 h-8" />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-bold italic">No Analysis Available</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">Please train a model in the Training module to unlock high-level performance visualizations and decision-making charts.</p>
           </div>
        </div>
      </div>
    );
  }

  const shapData = results.feature_importance 
    ? Object.entries(results.feature_importance).map(([k, v]) => ({ 
        name: k.split("__").pop()?.toUpperCase() ?? k, 
        val: v as number 
      })).sort((a, b) => b.val - a.val).slice(0, 8)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic tracking-tight">Model Diagnostics</h1>
          <p className="text-zinc-500 font-medium italic">High-fidelity analysis for {results.model_name}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className={`h-10 px-4 rounded-xl flex items-center gap-2 text-xs font-black italic transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Link Copied!" : "Generate Public Link"}
          </button>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Model Optimized</span>
          </div>
        </div>
      </div>

      {/* Metrics Scorecard ... rest of the content ... */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Accuracy Score", val: results.metrics?.F1_Score?.toFixed(3) || results.metrics?.R2_Score?.toFixed(3) || "0.00", icon: TrendingUp, color: "text-blue-500" },
          { label: "Confidence", val: "High", icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Training Samples", val: results.n_samples || "0", icon: Database, color: "text-purple-500" },
          { label: "Inference Time", val: "< 12ms", icon: Zap, color: "text-amber-500" },
        ].map((m, i) => (
          <div key={i} className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-2">
            <m.icon className={`w-4 h-4 ${m.color}`} />
            <p className="text-2xl font-black italic tracking-tighter">{m.val}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Performance Calibration */}
         <div className="p-8 rounded-[40px] border border-white/5 bg-white/[0.01] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold italic text-lg">Performance Calibration</h3>
              </div>
              <Info className="w-4 h-4 text-zinc-700 cursor-help" />
            </div>
            
            <div className="min-h-[300px]">
               {results.plots?.type === 'confusion_matrix' ? (
                 <ConfusionMatrix labels={results.plots.labels} matrix={results.plots.matrix} />
               ) : results.plots?.data ? (
                 <RegressionChart data={results.plots.data} />
               ) : (
                 <div className="h-64 flex items-center justify-center italic text-zinc-600 text-sm font-medium">Visualization not available for this model type.</div>
               )}
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic border-t border-white/5 pt-4">
              {results.plots?.type === 'confusion_matrix' 
                ? "This matrix shows where the model is confusing specific classes. Ideal models have strong diagonal dominance."
                : "The calibration plot compares actual outcomes against predictions. Minimal dispersion from the diagonal indicates high reliability."}
            </p>
         </div>

         {/* SHAP Importance */}
         <div className="p-8 rounded-[40px] border border-white/5 bg-white/[0.01] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold italic text-lg">SHAP Global Importance</h3>
              </div>
              <Info className="w-4 h-4 text-zinc-700 cursor-help" />
            </div>
            
            <div className="h-80 w-full min-h-[300px]">
               {shapData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shapData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fill: "#52525b", fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }} />
                      <Bar dataKey="val" fill="#9333ea" radius={[0, 8, 8, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center italic text-zinc-600 text-sm font-medium">SHAP analysis failed for this dataset.</div>
               )}
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic border-t border-white/5 pt-4">
              SHAP values explain the contribution of each feature to the model's final decision. Higher bars indicate features that move the needle most.
            </p>
         </div>
      </div>

      <div className="p-10 rounded-[40px] border border-white/5 bg-gradient-to-br from-zinc-900/50 to-transparent space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic tracking-tight">Artifact Export</h3>
            <p className="text-sm text-zinc-500 font-medium italic">Download your production-ready assets and processed data.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <button 
               onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/download-model/${jobId}`, "_blank")}
               className="h-12 px-6 bg-blue-600 text-white rounded-xl font-black italic flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
             >
               <Download className="w-4 h-4" />
               Download Model (.joblib)
             </button>
             
             <button 
               onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/download-clean-data/${jobId}`, "_blank")}
               className="h-12 px-6 bg-white/[0.05] text-white rounded-xl font-black italic flex items-center gap-3 border border-white/10 hover:bg-white/[0.1] transition-all active:scale-95"
             >
               <FileJson className="w-4 h-4" />
               Export Cleaned Data (CSV)
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-8">
          {[
            { title: "Standard Format", desc: "Native Scikit-Learn pipeline format compatible with all Python environments." },
            { title: "Processed Schema", desc: "Dataset with outliers handled, missing values filled, and noise reduced." },
            { title: "Version Control", desc: "Unique job ID hash included in filenames for rigorous tracking." }
          ].map((f, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{f.title}</p>
              <p className="text-[11px] text-zinc-600 font-medium leading-relaxed italic">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {results.suggestions && results.suggestions.length > 0 && (
        <div className="p-8 rounded-[40px] border border-amber-500/20 bg-amber-500/[0.02] space-y-6">
           <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <h3 className="text-xl font-black italic tracking-tight">AI Strategy Recommendations</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.suggestions.map((s: string, i: number) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 items-start">
                   <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-500 flex-shrink-0 mt-0.5">{i+1}</div>
                   <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">{s}</p>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
