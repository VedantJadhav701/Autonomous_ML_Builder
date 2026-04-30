"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface StudioContextType {
  // Data State
  csvBytes: File | null;
  setCsvBytes: (f: File | null) => void;
  csvHeaders: string[];
  setCsvHeaders: (h: string[]) => void;
  csvRows: any[];
  setCsvRows: (r: any[]) => void;
  
  // Training State
  targetCol: string;
  setTargetCol: (t: string) => void;
  suggestedTarget: string | null;
  setSuggestedTarget: (t: string | null) => void;
  jobId: string | null;
  jobStatus: any;
  results: any;
  trainErr: string | null;
  startTraining: (aggressive?: boolean) => Promise<void>;
  
  // Health/Alerts
  health: any;
  alerts: any[];
  latency: number | null;
  refreshHealth: () => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [csvBytes, setCsvBytes] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  
  const [targetCol, setTargetCol] = useState("");
  const [suggestedTarget, setSuggestedTarget] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [trainErr, setTrainErr] = useState<string | null>(null);
  const pollRef = useRef<any>(null);

  const [health, setHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const refreshHealth = useCallback(async () => {
    const t0 = Date.now();
    try {
      const [hRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/alerts`)
      ]);
      setLatency(Date.now() - t0);
      if (hRes.ok) setHealth(await hRes.json());
      if (aRes.ok) {
        const ad = await aRes.json();
        setAlerts(ad.alerts || []);
      }
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const iv = setInterval(refreshHealth, 5000);
    return () => clearInterval(iv);
  }, [refreshHealth]);

  const startTraining = async (aggressive: boolean = false) => {
    if (!csvBytes || !targetCol) return;
    setTrainErr(null);
    setResults(null);

    const form = new FormData();
    form.append("file", csvBytes);
    form.append("target_column", targetCol);
    form.append("task_type", "auto");
    form.append("aggressive", aggressive.toString());

    try {
      const res = await fetch(`${API_BASE}/train`, { method: "POST", body: form });
      if (!res.ok) {
        const e = await res.json();
        const msg = typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail);
        throw new Error(msg || "Failed to start training.");
      }
      const { job_id } = await res.json();
      setJobId(job_id);

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const sRes = await fetch(`${API_BASE}/status/${job_id}`);
          const s = await sRes.json();
          setJobStatus(s);
          if (s.status === "done") {
            clearInterval(pollRef.current);
            const rRes = await fetch(`${API_BASE}/results/${job_id}`);
            setResults(await rRes.json());
          } else if (s.status === "failed") {
            clearInterval(pollRef.current);
            setTrainErr(s.error || "Training failed.");
          }
        } catch (e) { /* keep polling */ }
      }, 1500);
    } catch (e: any) {
      setTrainErr(e.message);
    }
  };

  return (
    <StudioContext.Provider value={{
      csvBytes, setCsvBytes, csvHeaders, setCsvHeaders, csvRows, setCsvRows,
      targetCol, setTargetCol, suggestedTarget, setSuggestedTarget,
      jobId, jobStatus, results, trainErr, startTraining,
      health, alerts, latency, refreshHealth
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) throw new Error("useStudio must be used within a StudioProvider");
  return context;
}
