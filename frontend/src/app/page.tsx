"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, BarChart3, Binary, RefreshCcw, CheckCircle2, AlertTriangle, Cpu, Globe, Zap, Box, Terminal, Layers, Radar, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function CyberCommandCenter() {
  const [health, setHealth] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [explanations, setExplanations] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    age: 25,
    income: 50000,
    home_ownership: "RENT",
    emp_length: 4.0,
    loan_intent: "PERSONAL",
    loan_grade: "A",
    loan_amnt: 10000,
    loan_int_rate: 10.5,
    loan_percent_income: 0.2,
    cb_person_default_on_file: "N",
    cb_person_cred_hist_length: 5
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const h = await fetch(`${API_BASE}/health`);
        const a = await fetch(`${API_BASE}/alerts`);
        if(h.ok) setHealth(await h.json());
        if(a.ok) {
          const ad = await a.json();
          setAlerts(ad.alerts || []);
        }
      } catch (e) {}
    };
    poll();
    const inv = setInterval(poll, 4000);
    return () => clearInterval(inv);
  }, []);

  const runInference = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData] })
      });
      const d = await r.json();
      setPrediction(d);
      
      const ex = await fetch(`${API_BASE}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData] })
      });
      const ed = await ex.json();
      setExplanations(ed.explainability);
    } catch (e) {} finally { setLoading(false); }
  };

  const shapData = explanations ? 
    Object.entries(explanations[0])
      .map(([name, value]) => ({ 
        name: name.replace('num__', '').replace('cat__', '').toUpperCase(), 
        value: value as number
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 8) 
    : [];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 relative overflow-hidden text-cyan-400">
      {/* SCANLINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />

      {/* TOP HEADER - TELEMTRY */}
      <header className="flex justify-between items-center cyber-panel px-8 py-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-cyan-500/50 rounded-full flex items-center justify-center animate-spin-slow">
              <Radar className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-500 rounded-full animate-ping" />
          </div>
          <div>
            <h1 className="text-2xl font-black glow-cyan tracking-tighter">NEURAL_DECODER_v1</h1>
            <p className="text-[10px] font-bold text-cyan-500/60 uppercase">Autonomous Intelligence Stream // Active Cluster 01</p>
          </div>
        </div>
        
        <div className="flex gap-12 text-[10px] font-bold">
          <DataBit label="SYSTEM_LOAD" value="12.4%" trend="DOWN" />
          <DataBit label="INF_LATENCY" value="8.42ms" trend="STABLE" />
          <DataBit label="UPTIME" value="99.98%" trend="UP" />
          <div className="h-10 w-[1px] bg-cyan-500/20" />
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", health?.pipeline_loaded ? "bg-cyan-500 animate-pulse" : "bg-red-900")} />
              <span className="opacity-50">PIPE_SYNC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", health?.explainer_loaded ? "bg-cyan-500 animate-pulse" : "bg-red-900")} />
              <span className="opacity-50">SHAP_CORE</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN COMMAND GRID */}
      <div className="flex-1 grid grid-cols-12 gap-6">
        
        {/* LEFT: INPUT TERMINAL */}
        <div className="col-span-12 lg:col-span-3 cyber-panel p-6 flex flex-col gap-8">
          <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-4">
            <Terminal className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase">Data_Injection_Shell</h2>
          </div>
          
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(formData).map(([k, v]) => (
              <CyberInput 
                key={k} 
                label={k.toUpperCase()} 
                value={v} 
                onChange={(val) => setFormData(prev => ({...prev, [k]: isNaN(Number(val)) ? val : Number(val)}))} 
              />
            ))}
          </div>

          <button 
            onClick={runInference}
            disabled={loading}
            className="cyber-button w-full py-4 mt-4 flex items-center justify-center gap-4 text-sm"
          >
            {loading ? "PROCESSING..." : <>INITIATE_DECODING <Layers className="w-4 h-4" /></>}
          </button>
        </div>

        {/* CENTER: CORE VIZ */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          <div className="flex-1 cyber-panel p-10 flex flex-col items-center justify-center relative group">
            <div className="absolute top-0 left-0 p-4 text-[8px] font-bold opacity-30 select-none">DECISION_MATRIX // OUTPUT_STREAM</div>
            
            <AnimatePresence mode="wait">
              {prediction ? (
                <motion.div 
                  key={prediction.predictions[0]}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.5em] opacity-40">Classification Result</p>
                  <div className={cn(
                    "text-8xl font-black italic tracking-tighter",
                    prediction.predictions[0] === 0 ? "text-cyan-400 glow-cyan" : "text-rose-500 glow-red"
                  )}>
                    {prediction.predictions[0] === 0 ? "PASS" : "FAIL"}
                  </div>
                  <div className="px-6 py-2 border border-cyan-500/20 rounded-full text-[10px] font-bold bg-cyan-500/5">
                    REQ_ID: {prediction.request_ids[0].split('-')[0]}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-20">
                  <Cpu className="w-32 h-32 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-[1em]">Standby</p>
                </div>
              )}
            </AnimatePresence>

            {/* DECORATIVE CORNERS */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
          </div>

          <div className="h-1/3 cyber-panel p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase flex items-center gap-2"><Database className="w-3 h-3" /> SHAP_VECTORS</h3>
              <div className="text-[8px] opacity-40">Feature Impact Coefficient</div>
            </div>
            <div className="flex-1 w-full">
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: "rgba(0,242,255,0.4)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(0,242,255,0.05)" }} contentStyle={{ background: "#00141e", border: "1px solid #00f2ff33", fontSize: 10 }} />
                    <Bar dataKey="value" barSize={12}>
                      {shapData.map((e, i) => (
                        <Cell key={i} fill={e.value > 0 ? "#00f2ff" : "#ff0055"} fillOpacity={0.6} stroke={e.value > 0 ? "#00f2ff" : "#ff0055"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-10 text-[10px] uppercase font-black">No Data Vectorized</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: SYSTEM LOGS & CONSTRAINTS */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="flex-1 cyber-panel p-6 flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase flex items-center gap-2 border-b border-cyan-500/20 pb-4"><Layers className="w-3 h-3" /> SENTINEL_LOGS</h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {alerts.length === 0 ? (
                  <div className="text-[10px] text-cyan-500/20 italic p-4 text-center">SCANNING FOR ANOMALIES...</div>
                ) : (
                  alerts.slice().reverse().map((a, i) => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="p-3 bg-cyan-500/5 border-l-2 border-cyan-500/40 space-y-1">
                      <div className="flex justify-between text-[8px] font-extrabold uppercase">
                        <span>{a.title}</span>
                        <span className="opacity-40">{new Date(a.timestamp*1000).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[9px] text-cyan-500/60 leading-tight">{a.message}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="cyber-panel p-6 space-y-4">
             <h3 className="text-[10px] font-black uppercase text-center border-b border-cyan-500/20 pb-2">Hardware_Enforcement</h3>
             <div className="space-y-3">
                <ConstraintBit label="MAX_ROWS" value="50,000" limit="50k" color="cyan" />
                <ConstraintBit label="RAM_LIMIT" value="450MB" limit="1GB" color="cyan" />
                <ConstraintBit label="CPU_CORE" value="2x" limit="2x" color="red" />
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function CyberInput({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[8px] font-black text-cyan-500/40 tracking-widest">{label}</label>
      <input 
        type={typeof value === 'number' ? 'number' : 'text'}
        className="w-full bg-cyan-950/20 border-b border-cyan-500/20 px-0 py-2 text-xs font-bold text-cyan-300 outline-none focus:border-cyan-500 transition-all placeholder:text-cyan-900/50"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`ENTER_${label}`}
      />
    </div>
  );
}

function DataBit({ label, value, trend }: { label: string, value: string, trend: "UP" | "DOWN" | "STABLE" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] text-cyan-500/40 uppercase tracking-tighter">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-cyan-300">{value}</span>
        <span className={cn("text-[7px] font-bold", trend === "UP" ? "text-cyan-400" : trend === "DOWN" ? "text-rose-500" : "text-cyan-500/50")}>[{trend}]</span>
      </div>
    </div>
  );
}

function ConstraintBit({ label, value, limit, color }: { label: string, value: string, limit: string, color: "cyan" | "red" }) {
  return (
    <div className="flex justify-between items-center text-[10px]">
      <span className="opacity-40 font-bold">{label}</span>
      <div className="flex gap-2">
        <span className="font-extrabold">{value}</span>
        <span className={cn("px-1 rounded text-[8px] border", color === "red" ? "border-rose-500/30 text-rose-500" : "border-cyan-500/30 text-cyan-400")}>{limit}</span>
      </div>
    </div>
  );
}
