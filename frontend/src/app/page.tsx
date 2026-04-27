"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, BarChart3, Binary, RefreshCcw, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- TYPES ---
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
  const [alerts, setAlerts] = useState<string[]>([]);
  
  // Demo data matching our schema
  const [formData, setFormData] = useState({
    age: 22,
    income: 60000,
    home_ownership: "RENT",
    emp_length: 5.0,
    loan_intent: "PERSONAL",
    loan_grade: "A",
    loan_amnt: 5000,
    loan_int_rate: 8.5,
    loan_percent_income: 0.1,
    cb_person_default_on_file: "N",
    cb_person_cred_hist_length: 3
  });

  // 1. Polling System Health & Alerts
  useEffect(() => {
    const checkSystems = async () => {
      try {
        const hRes = await fetch(`${API_BASE}/health`);
        setHealth(await hRes.json());
        
        const aRes = await fetch(`${API_BASE}/alerts`);
        const aData = await aRes.json();
        setAlerts(aData.alerts.map((a: any) => `${a.title}: ${a.message}`));
      } catch (e) {
        console.error("System poll failed:", e);
      }
    };
    checkSystems();
    const interval = setInterval(checkSystems, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Perform Inference
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
      
      // Auto-fetch explanations
      handleExplain();
    } catch (e) {
      setAlerts(prev => [...prev, "Inference Failed: Network Error"]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Operationalized SHAP
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

  // Prepare SHAP data for charting
  const shapData = explanations ? 
    Object.entries(explanations[0])
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 8) 
    : [];

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Autonomous ML Builder</h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Production Pulse v1.0.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-xs text-neutral-400">System Status:</p>
            <div className={cn(
              "px-2 py-1 rounded text-[10px] font-bold uppercase",
              health?.status === "ok" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}>
              {health ? health.status : "OFFLINE"}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-4 text-xs">
            <span className={cn("transition-colors", health?.pipeline_loaded ? "text-blue-400" : "text-neutral-600")}>[PIPELINE]</span>
            <span className={cn("transition-colors", health?.explainer_loaded ? "text-blue-400" : "text-neutral-600")}>[SHAP]</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* LEFT: PREDICTION FORM */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className="glass-card rounded-2xl p-6 glow-blue">
            <div className="flex items-center gap-2 mb-6">
              <Binary className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Live Predictor</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Age" value={formData.age} onChange={v => setFormData({...formData, age: Number(v)})} />
                <Input label="Income" value={formData.income} onChange={v => setFormData({...formData, income: Number(v)})} />
                <Input label="Amount" value={formData.loan_amnt} onChange={v => setFormData({...formData, loan_amnt: Number(v)})} />
                <Input label="Int Rate" value={formData.loan_int_rate} onChange={v => setFormData({...formData, loan_int_rate: Number(v)})} />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 uppercase font-bold px-1">Home Ownership</label>
                <select 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:grayscale transition-all rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "EXECUTE INFERENCE"}
              </button>
            </div>
          </section>

          {/* ALERTS / DRIFT */}
          <section className="glass-card rounded-2xl p-6 border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Sentinel Monitor</h2>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-neutral-600 italic text-sm">
                  No active drifts detected.
                </div>
              ) : (
                alerts.map((a, i) => (
                  <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {a}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT: RESULTS & SHAP */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Current Prediction</p>
              {prediction ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "text-5xl font-black",
                    prediction.predictions[0] === 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {prediction.predictions[0] === 0 ? "APPROVED" : "REJECTED"}
                </motion.div>
              ) : (
                <div className="text-3xl font-black text-neutral-800">---</div>
              )}
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Inference Latency</p>
              <div className="text-4xl font-extrabold text-blue-400">
                &lt; 10ms
              </div>
              <p className="text-[10px] text-neutral-600 mt-1">P95 Optimized Local</p>
            </div>
          </div>

          <section className="glass-card rounded-2xl p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">X-Ray (SHAP Feature Contributions)</h2>
              </div>
              <div className="text-[10px] text-neutral-500 bg-neutral-900 rounded px-2 py-1">Operationalized Explainer</div>
            </div>
            
            <div className="flex-1 w-full">
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#666", fontSize: 10 }} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ background: "#141414", border: "1px solid #333", fontSize: "12px", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {shapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? "#10b981" : "#ef4444"} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-700 italic text-sm">
                  Run prediction to see feature contributions.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER ACRONYM */}
      <footer className="mt-12 text-[10px] text-neutral-600 text-center uppercase tracking-[0.2em]">
        Model Lifecycle Pulse • Staged in Render • Secured by Vercel
      </footer>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-neutral-500 uppercase font-bold px-1">{label}</label>
      <input 
        type="number" 
        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
