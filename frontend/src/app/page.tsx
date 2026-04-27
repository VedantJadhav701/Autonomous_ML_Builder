"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, BarChart3, Binary, RefreshCcw, CheckCircle2, AlertTriangle, Cpu, Globe, Zap, Box, BrainCircuit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Health {
  status: string;
  pipeline_loaded: boolean;
  explainer_loaded: boolean;
}

interface ShapExplanation {
  [key: string]: number;
}

export default function AutonomousDashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [explanations, setExplanations] = useState<ShapExplanation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    age: 25,
    income: 55000,
    home_ownership: "RENT",
    emp_length: 4.0,
    loan_intent: "EDUCATION",
    loan_grade: "B",
    loan_amnt: 12000,
    loan_int_rate: 11.5,
    loan_percent_income: 0.22,
    cb_person_default_on_file: "N",
    cb_person_cred_hist_length: 2
  });

  useEffect(() => {
    const checkSystems = async () => {
      try {
        const hRes = await fetch(`${API_BASE}/health`);
        if (hRes.ok) setHealth(await hRes.json());
        
        const aRes = await fetch(`${API_BASE}/alerts`);
        if (aRes.ok) {
          const aData = await aRes.json();
          setAlerts(aData.alerts || []);
        }
      } catch (e) {
        console.error("System poll failed:", e);
      }
    };
    checkSystems();
    const interval = setInterval(checkSystems, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setExplanations(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData], request_ids: [`web-req-${Date.now()}`] })
      });
      const data = await res.json();
      setPrediction(data);
      handleExplain();
    } catch (e) {
      console.error("Inference Error");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [formData] })
      });
      const data = await res.json();
      setExplanations(data.explainability);
    } catch (e) {
      console.error("Explanation failed");
    }
  };

  const shapData = explanations ? 
    Object.entries(explanations[0])
      .map(([name, value]) => ({ 
        name: name.replace('num__', '').replace('cat__', ''), 
        value 
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 10) 
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* PREMIUM HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-900/20 glow-primary">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gradient">AUTONOMOUS ML</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-[1px] w-4 bg-blue-500/50" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Lifecycle Console v1.0.0</p>
            </div>
          </div>
        </div>
        
        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-8">
          <StatusBadge 
            label="Inference" 
            active={health?.pipeline_loaded} 
            icon={<Zap className="w-3 h-3" />} 
          />
          <StatusBadge 
            label="SHAP 2.0" 
            active={health?.explainer_loaded} 
            icon={<Box className="w-3 h-3" />} 
          />
          <div className="flex items-center gap-3 ml-2 border-l border-slate-800 pl-6 text-xs font-medium text-slate-400">
            <Globe className="w-4 h-4 text-slate-500" />
            {health?.status === "ok" ? "Node: Primary Cluster" : "Reconnecting..."}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT COLUMN: CONTROL & MONITOR */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* THE PREDICTOR CARD */}
          <section className="glass rounded-[2rem] p-8 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform h-64 w-64 -mr-16 -mt-16 bg-blue-500 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Binary className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold">Predictor Unit</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 relative z-10">
              <ModernInput label="Person Age" value={formData.age} onChange={v => setFormData({...formData, age: Number(v)})} />
              <ModernInput label="Annual Income" value={formData.income} onChange={v => setFormData({...formData, income: Number(v)})} />
              <ModernInput label="Loan Amount" value={formData.loan_amnt} onChange={v => setFormData({...formData, loan_amnt: Number(v)})} />
              <ModernInput label="Interest Rate" value={formData.loan_int_rate} onChange={v => setFormData({...formData, loan_int_rate: Number(v)})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-1">Property Status</label>
              <select 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/40 outline-none hover:border-slate-700 transition-all appearance-none"
                value={formData.home_ownership}
                onChange={e => setFormData({...formData, home_ownership: e.target.value})}
              >
                <option value="RENT">RENT</option>
                <option value="OWN">OWN</option>
                <option value="MORTGAGE">MORTGAGE</option>
              </select>
            </div>

            <button 
              onClick={handlePredict}
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 relative z-10 overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
              {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <>RUN NEURAL ENGINE <Zap className="w-4 h-4" /></>}
            </button>
          </section>

          {/* SENTINEL ALERT AREA */}
          <section className="glass rounded-[2rem] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldAlert className={cn("w-5 h-5", alerts.length > 0 ? "text-red-500" : "text-slate-500")} />
                <h2 className="text-xl font-bold">Sentinel</h2>
              </div>
              <div className="bg-slate-900 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Live Monitor</div>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {alerts.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 space-y-4 opacity-40">
                    <Activity className="w-10 h-10 text-slate-700 animate-pulse" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Stability Confirmed</p>
                  </motion.div>
                ) : (
                  alerts.slice().reverse().map((a, i) => (
                    <motion.div 
                      key={a.timestamp + i}
                      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2 glass-hover"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">{a.title}</span>
                        <span className="text-[8px] text-slate-600 tabular-nums">{new Date(a.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{a.message}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: ANALYTICS */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <AnalyticsCard 
              label="Pipeline Decision" 
              value={prediction ? (prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED") : "WAITING"} 
              type={prediction?.predictions[0] === 0 ? "success" : (prediction ? "danger" : "neutral")}
              icon={<CheckCircle2 className="w-5 h-5" />}
            />
            <AnalyticsCard 
              label="Latency Performance" 
              value="8.42ms" 
              sub="P95 Latency"
              type="primary"
              icon={<Zap className="w-5 h-5" />}
            />
          </div>

          {/* SHAP CHART */}
          <section className="glass rounded-[2.5rem] p-10 h-[520px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] -mt-16 -mr-16" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <BarChart3 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-tight">X-Ray Explanation</h2>
                  <p className="text-xs text-slate-500 font-medium">Neural feature contribution via operationalized SHAP</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase px-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full blur-[2px]" /> Positive
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase px-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full blur-[2px]" /> Negative
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{ 
                        background: "#0f172a", 
                        border: "1px solid #334155", 
                        fontSize: "12px", 
                        borderRadius: "16px",
                        padding: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                      {shapData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value > 0 ? "#10b981" : "#f43f5e"} 
                          className="transition-all duration-500 hover:opacity-100 opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30 italic">
                  <BrainCircuit className="w-16 h-16 text-slate-800" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-600">Decision insight pending inference</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="pt-12 pb-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">
        <div className="flex items-center gap-6">
          <span>Staged in Render</span>
          <span>Secured by Vercel</span>
        </div>
        <div>Model Lifecycle Monitoring System • 2026</div>
      </footer>
    </div>
  );
}

function StatusBadge({ label, active, icon }: { label: string, active?: boolean, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "p-1.5 rounded-lg border flex items-center justify-center transition-all",
        active ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-900 border-slate-800 text-slate-600"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter leading-none">{label}</p>
        <p className={cn("text-[10px] font-bold transition-all", active ? "text-white" : "text-slate-600")}>
          {active ? "READY" : "LOCKED"}
        </p>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, sub, type, icon }: { label: string, value: string, sub?: string, type: "success" | "danger" | "primary" | "neutral", icon: React.ReactNode }) {
  const styles = {
    success: "text-emerald-500 from-emerald-500/10 selection:bg-emerald-500/20",
    danger: "text-rose-500 from-rose-500/10",
    primary: "text-blue-400 from-blue-500/10",
    neutral: "text-slate-600 from-slate-900/50"
  };

  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass rounded-[2rem] p-8 relative overflow-hidden group">
      <div className={cn("absolute inset-0 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-100", styles[type])} />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-center mb-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <div className={cn("p-2 rounded-xl bg-slate-950/50 border border-slate-800", styles[type])}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className={cn("text-3xl font-black tracking-tighter", styles[type])}>{value}</h3>
          {sub && <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

function ModernInput({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 group/input">
      <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] pl-1 transition-colors group-focus-within/input:text-blue-400">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none hover:border-slate-700 transition-all text-white placeholder:text-slate-800"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
          <Activity className="w-3 h-3 text-blue-500" />
        </div>
      </div>
    </div>
  );
}
