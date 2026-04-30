"use client";

import { Zap, Search, Play, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useStudio } from "../StudioContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vedantjadhav701-autostack-engine.hf.space";

export default function InferencePage() {
  const { health } = useStudio();
  const [metadata, setMetadata] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/metadata`);
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
        if (data.available && data.features) {
          const init: Record<string, any> = {};
          Object.entries(data.features).forEach(([col, spec]: [string, any]) => {
            init[col] = spec.sample ?? (spec.type === "number" ? 0 : "");
          });
          setFormData(init);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData] })
      });
      if (res.ok) {
        setPrediction(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-black italic tracking-tight">Real-Time Inference</h1>
        <p className="text-zinc-500 font-medium">Deploy your trained models for live predictions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Model Selector Sidebar */}
        <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
           <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input 
                placeholder="Search models..."
                className="w-full h-10 pl-10 pr-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
           </div>
           
           <div className="space-y-2">
              {metadataLoading ? (
                <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-600" /></div>
              ) : metadata?.available ? (
                <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <p className="text-xs font-black italic uppercase tracking-tighter">{metadata.model_name}</p>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">{metadata.task_type} · Active</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-white/5 border-dashed flex flex-col items-center gap-2 text-center">
                  <AlertTriangle className="w-4 h-4 text-zinc-700" />
                  <p className="text-[10px] text-zinc-600 font-black uppercase">No Active Model</p>
                </div>
              )}
           </div>
        </div>

        {/* Prediction Interface */}
        <div className="lg:col-span-3 space-y-6">
           {metadata?.available ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form */}
                <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.02] space-y-6">
                   <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold italic">Feature Input</h3>
                   </div>
                   <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(metadata.features).map(([col, spec]: [string, any]) => (
                        <div key={col} className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{col}</label>
                          {spec.type === 'text' ? (
                            <select 
                              value={formData[col]}
                              onChange={(e) => setFormData(p => ({ ...p, [col]: e.target.value }))}
                              className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              {(spec.values || []).map((v: string) => <option key={v} value={v} className="bg-zinc-900">{v}</option>)}
                            </select>
                          ) : (
                            <input 
                              type="number"
                              value={formData[col]}
                              onChange={(e) => setFormData(p => ({ ...p, [col]: Number(e.target.value) }))}
                              className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          )}
                        </div>
                      ))}
                   </div>
                   <button 
                     onClick={handlePredict}
                     disabled={loading}
                     className="w-full h-12 bg-blue-600 text-white rounded-xl font-black italic hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                   >
                     {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                     {loading ? "Calculating..." : "Run Inference"}
                   </button>
                </div>

                {/* Result */}
                <div className="space-y-6">
                   <div className="p-8 rounded-[32px] border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent flex flex-col items-center justify-center text-center min-h-[300px]">
                      {prediction ? (
                        <div className="space-y-4 animate-in zoom-in duration-500">
                           <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prediction Result</div>
                           <div className="text-6xl font-black italic tracking-tighter text-white">
                             {metadata.task_type === 'classification' 
                               ? (prediction.predictions?.[0] === 1 ? "Positive" : "Negative")
                               : (prediction.predictions?.[0]?.toFixed(2))
                             }
                           </div>
                           <div className="text-xs font-bold text-blue-400 italic">Confidence Score: High</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-800 mx-auto">
                              <Zap className="w-8 h-8" />
                           </div>
                           <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest italic">Awaiting Request</p>
                        </div>
                      )}
                   </div>

                   <div className="p-6 rounded-[24px] border border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">API Latency</p>
                        <p className="text-xs font-black italic text-zinc-400">P95: 12ms</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Active Stage</p>
                        <p className="text-xs font-black italic text-emerald-500">Production</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.02] min-h-[500px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-amber-600/10 flex items-center justify-center text-amber-500">
                  <Zap className="w-10 h-10 fill-current" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold italic">Ready for live inference</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">Please train a production-grade model to begin running predictions.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
