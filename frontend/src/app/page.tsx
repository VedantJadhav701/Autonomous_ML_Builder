"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, Shield, BrainCircuit, Activity, ChevronRight, 
  Binary, BarChart3, Database, Layers, Radio, Globe, 
  Cpu, Terminal, Command, Box, Lock, RefreshCcw, 
  CheckCircle2, AlertTriangle, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AutonomousHome() {
  const [launched, setLaunched] = useState(false);

  return (
    <main className="min-h-screen bg-[#02040a] selection:bg-blue-500/30 selection:text-blue-200">
      <AnimatePresence mode="wait">
        {!launched ? (
          <LandingView key="landing" onLaunch={() => setLaunched(true)} />
        ) : (
          <AppView key="app" onBack={() => setLaunched(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

// --- LANDING VIEW ---
function LandingView({ onLaunch }: { onLaunch: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
      className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center gap-12"
    >
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 border-b border-white/5 bg-[#02040a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-1.5 rounded-lg">
                <BrainCircuit className="w-5 h-5 text-white" />
             </div>
             <span className="font-black tracking-tighter text-lg uppercase">Autonomous.ml</span>
          </div>
          <button onClick={onLaunch} className="text-xs font-bold uppercase tracking-widest px-6 py-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">
            Open Terminal
          </button>
        </div>
      </header>

      <div className="space-y-6 max-w-4xl">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <Radio className="w-3 h-3" /> v1.0.0 Production Release
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white"
        >
          THE FUTURE OF <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 italic">SELF-HEALING</span> ML.
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Resource-constrained, autonomous machine learning lifecycle. 
          From adaptive engineering to live SHAP explanations. Built for the modern stack.
        </motion.p>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button 
          onClick={onLaunch}
          className="btn-primary group px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest"
        >
          LAUNCH APPLICATION <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="px-10 py-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all font-black text-xs uppercase tracking-widest">
          View Repository
        </button>
      </motion.div>

      {/* HERO IMAGE / STATS MOCK */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
        className="w-full mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
      >
        <FeatureCard 
          icon={<Zap className="text-blue-500" />} 
          title="Ultra-Low Latency" 
          desc="Optimized sub-10ms P95 inference cycles on shared CPU cores."
        />
        <FeatureCard 
          icon={<Shield className="text-emerald-500" />} 
          title="Safe-Mode Tuning" 
          desc="LLM-guarded structural planner prevents architectural failures."
        />
        <FeatureCard 
          icon={<Activity className="text-indigo-500" />} 
          title="Drift Sentinel" 
          desc="Real-time KS-Test detection with asynchronous noise reduction."
        />
      </motion.div>
    </motion.div>
  );
}

// --- APP VIEW (DASHBOARD) ---
function AppView({ onBack }: { onBack: () => void }) {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [shap, setShap] = useState<any[] | null>(null);
  const [formData, setFormData] = useState({
     age: 28, income: 72000, home_ownership: "RENT", emp_length: 6, loan_amnt: 15000, loan_int_rate: 12.5
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) setHealth(await res.json());
      } catch (e) {}
    };
    poll();
    const inv = setInterval(poll, 5000);
    return () => clearInterval(inv);
  }, []);

  const handleRun = async () => {
    setLoading(true);
    try {
      const pRes = await fetch(`${API_BASE}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData] })
      });
      const pData = await pRes.json();
      setPrediction(pData);

      const sRes = await fetch(`${API_BASE}/explain`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData] })
      });
      const sData = await sRes.json();
      setShap(sData.explainability);
    } catch (e) {} finally { setLoading(false); }
  };

  const shapData = shap ? Object.entries(shap[0]).map(([k, v]) => ({ name: k.split('__').pop()?.toUpperCase(), val: v as number })).sort((a,b) => Math.abs(b.val)-Math.abs(a.val)).slice(0,6) : [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
    >
      <nav className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-10">
          <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
             <h2 className="font-black text-xl tracking-tight uppercase">Operational Console</h2>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Globe className="w-3 h-3" /> NODE_041 // {health?.status === "ok" ? "PRIMARY_SYNC" : "OFFLINE"}
             </div>
          </div>
        </div>
        <div className="flex gap-4">
           <StatusBit label="Pipeline" active={health?.pipeline_loaded} />
           <StatusBit label="SHAP_Core" active={health?.explainer_loaded} />
        </div>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* INPUTS */}
        <div className="md:col-span-4 glass rounded-[2.5rem] p-8 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/5 pb-6">
            <Terminal className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold uppercase tracking-widest text-sm text-blue-400">Data Injection</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AppInput label="Age" value={formData.age} onChange={v => setFormData({...formData, age: Number(v)})} />
            <AppInput label="Income" value={formData.income} onChange={v => setFormData({...formData, income: Number(v)})} />
            <AppInput label="Amount" value={formData.loan_amnt} onChange={v => setFormData({...formData, loan_amnt: Number(v)})} />
            <AppInput label="Rate" value={formData.loan_int_rate} onChange={v => setFormData({...formData, loan_int_rate: Number(v)})} />
          </div>
          <button 
            onClick={handleRun}
            disabled={loading}
            className="w-full btn-primary py-4 rounded-xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "EXECUTE_INFERENCE"}
          </button>
        </div>

        {/* DECISION & VIZ */}
        <div className="md:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="glass rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[180px]">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ML Precision Match</p>
               {prediction ? (
                 <div className={cn("text-6xl font-black italic", prediction.predictions[0] === 0 ? "text-emerald-400 text-glow" : "text-rose-500 text-glow")}>
                    {prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
                 </div>
               ) : <div className="text-4xl font-black text-white/10 uppercase tracking-tighter italic">Pending</div>}
            </div>
            <div className="glass rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[180px]">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Inference Speed</p>
               <div className="text-5xl font-black text-blue-400 tabular-nums">&lt;10ms</div>
               <p className="text-[10px] font-bold text-slate-600 mt-2">v.1.0 Optimized</p>
            </div>
          </div>

          <div className="glass rounded-[3rem] p-10 h-[400px] flex flex-col">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-3">
                 <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                 <h3 className="font-bold text-lg">Explainability Vectors (SHAP)</h3>
               </div>
             </div>
             <div className="flex-1 w-full">
               {shapData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={shapData} layout="vertical">
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={100} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "#0c0d12", border: "1px solid #ffffff11" }} />
                     <Bar dataKey="val" radius={[0, 8, 8, 0]} barSize={20}>
                        {shapData.map((e,i) => (
                           <Cell key={i} fill={e.val > 0 ? "#10b981" : "#f43f5e"} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center opacity-10 font-black italic uppercase tracking-widest text-sm">Waiting for Vector Stream...</div>}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- SUB-COMPONENTS ---
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass p-8 rounded-[2rem] space-y-4 hover:border-white/10 transition-all group">
      <div className="p-3 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-black text-xl uppercase tracking-tighter">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function StatusBit({ label, active }: { label: string, active?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className={cn("w-2 h-2 rounded-full", active ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-red-900")} />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

function AppInput({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">{label}</label>
      <input 
        type="number" 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
      />
    </div>
  );
}
