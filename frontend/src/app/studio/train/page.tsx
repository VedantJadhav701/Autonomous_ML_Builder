"use client";

import { Cpu, History, Play, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useStudio } from "../StudioContext";
import { useRouter } from "next/navigation";
import TerminalLoader from "@/components/TerminalLoader";

export default function TrainPage() {
  const { csvBytes, csvHeaders, targetCol, setTargetCol, suggestedTarget, startTraining, jobStatus, results, trainErr } = useStudio();
  const router = useRouter();

  const isRunning = jobStatus?.status === "running" || jobStatus?.status === "queued";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic tracking-tight">Train Model</h1>
          <p className="text-zinc-500 font-medium">Configure and launch autonomous stacking ensembles.</p>
        </div>
        <button 
          onClick={() => startTraining(false)}
          disabled={!csvBytes || isRunning}
          className="flex items-center gap-2 px-6 h-12 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isRunning ? "Engine Running..." : "Start Training"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config Panel */}
        <div className="lg:col-span-2 p-8 rounded-3xl border border-white/5 bg-white/[0.02] space-y-8">
           <div className="flex items-center gap-3 pb-6 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold italic text-lg">Engine Configuration</h3>
           </div>
           
           {!csvBytes ? (
             <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-zinc-700">
                  <Cpu className="w-8 h-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-400">Ready for Training</p>
                  <p className="text-xs text-zinc-600 italic">Please upload a dataset in the Clean Data module first.</p>
                </div>
             </div>
           ) : isRunning ? (
             <div className="py-10 animate-in zoom-in duration-700">
               <TerminalLoader />
             </div>
           ) : (
             <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Column (y-variable)</label>
                  <select 
                    value={targetCol}
                    onChange={(e) => setTargetCol(e.target.value)}
                    className="w-full h-14 px-5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {csvHeaders.map(h => (
                      <option key={h} value={h} className="bg-zinc-900">{h} {h === suggestedTarget ? "★ Recommended" : ""}</option>
                    ))}
                  </select>
                </div>

                {jobStatus && (
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black italic tracking-tight">{jobStatus.stage}</p>
                      <p className="text-xs font-black text-blue-500">{jobStatus.progress}%</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-500" 
                        style={{ width: `${jobStatus.progress}%` }}
                      />
                    </div>
                    {jobStatus.eta_seconds && (
                      <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                        Estimated {jobStatus.eta_seconds}s remaining
                      </p>
                    )}
                  </div>
                )}

                {results && (
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between animate-in zoom-in duration-500">
                     <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <div>
                          <p className="text-lg font-black italic">Training Successful</p>
                          <p className="text-xs text-zinc-500 font-medium italic">{results.model_name} ready for inference</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => router.push("/studio/visualize")}
                       className="px-6 h-10 bg-blue-600 text-white rounded-xl text-xs font-black italic hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                     >
                       View Results
                     </button>
                  </div>
                )}

                {trainErr && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold italic">
                    {trainErr}
                  </div>
                )}
             </div>
           )}
        </div>

        {/* History / Recent Runs */}
        <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
           <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-zinc-400">
                <History className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Model Pipeline</span>
              </div>
           </div>
           
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-white/5 bg-[#0d0d0d] space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active Architecture</p>
                 <div className="space-y-2">
                    {["XGBoost", "CatBoost", "LightGBM", "Meta-Learner"].map(m => (
                      <div key={m} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold text-zinc-400 italic">{m}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Advanced / Locked Features */}
              <div className="p-6 rounded-2xl border border-blue-500/10 bg-blue-600/[0.02] space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/60">Advanced Architectures</p>
                    <div className="px-2 py-0.5 rounded-md bg-blue-600/10 border border-blue-600/20 text-[8px] font-black uppercase tracking-widest text-blue-500">Enterprise</div>
                 </div>
                 <div className="space-y-3 opacity-40">
                    <div className="flex items-center justify-between group cursor-not-allowed">
                       <span className="text-xs font-bold text-zinc-500 italic">Deep Neural Networks</span>
                       <div className="w-3 h-3 border border-white/10 rounded" />
                    </div>
                    <div className="flex items-center justify-between group cursor-not-allowed">
                       <span className="text-xs font-bold text-zinc-500 italic">GPU Accelerated (H100)</span>
                       <div className="w-3 h-3 border border-white/10 rounded" />
                    </div>
                    <div className="flex items-center justify-between group cursor-not-allowed">
                       <span className="text-xs font-bold text-zinc-500 italic">Custom Stack Logic</span>
                       <div className="w-3 h-3 border border-white/10 rounded" />
                    </div>
                 </div>
                 <div className="pt-2">
                    <p className="text-[9px] font-bold text-zinc-500 italic leading-relaxed mb-4">Need higher accuracy or processing &gt;10k rows? Unlock the Enterprise Engine.</p>
                    <a 
                      href="https://calendly.com/vedantjadhav1414/30min" 
                      target="_blank"
                      className="flex items-center justify-center w-full h-10 bg-blue-600/10 border border-blue-600/20 rounded-xl text-[10px] font-black italic text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-600/5"
                    >
                      Book a Strategy Session
                    </a>
                 </div>
              </div>

              {results && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 space-y-4 shadow-xl shadow-blue-500/20">
                   <Sparkles className="w-6 h-6" />
                   <div className="space-y-1">
                      <p className="text-2xl font-black italic tracking-tighter">
                        {results.metrics?.F1_Score?.toFixed(3) || results.metrics?.R2_Score?.toFixed(3) || "0.00"}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Primary Model Score</p>
                   </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
