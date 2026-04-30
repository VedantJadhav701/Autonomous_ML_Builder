"use client";

import { Database, Upload, FileText, CheckCircle2 } from "lucide-react";
import { useStudio } from "../StudioContext";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function CleanPage() {
  const { csvBytes, setCsvBytes, csvHeaders, setCsvHeaders, csvRows, setCsvRows, setTargetCol, setSuggestedTarget } = useStudio();
  const [loading, setLoading] = useState(false);

  const processCSV = async (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return;
      
      const headers = lines[0].split(",").map(h => h.trim().replace(/"|'/g, ""));
      const rows = lines.slice(1, 6).map(line => {
        const vals = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || "").trim().replace(/"|'/g, "")]));
      });

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvBytes(file);

      // Analyze
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`${API_BASE}/analyze-csv`, { method: "POST", body: form });
        const data = await res.json();
        if (data.suggested_target) {
          setSuggestedTarget(data.suggested_target);
          setTargetCol(data.suggested_target);
        } else {
          setTargetCol(headers[headers.length - 1]);
        }
      } catch (err) {
        setTargetCol(headers[headers.length - 1]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processCSV(f);
  };

  const loadSample = (type: 'churn' | 'pricing') => {
    const csvData = type === 'churn' 
      ? `age,salary,contract_length,monthly_charges,total_charges,churn
32,54000,12,65,780,No
45,82000,24,95,2280,Yes
22,31000,6,45,270,No
38,61000,12,70,840,Yes
29,48000,12,55,660,No
52,91000,24,105,2520,No
31,52000,1,60,60,Yes
41,75000,12,85,1020,No
25,35000,6,50,300,No
47,88000,24,90,2160,No
35,62000,12,75,900,Yes
28,44000,6,55,330,No
50,95000,24,110,2640,No
33,56000,1,65,65,Yes
42,78000,12,80,960,No
26,38000,6,48,288,No
48,89000,24,95,2280,No
36,64000,12,72,864,Yes
24,32000,6,42,252,No
49,92000,24,100,2400,No`
      : `strike_price,spot_price,volatility,time_to_expiry,interest_rate,option_price
100,105,0.2,0.5,0.05,7.45
90,92,0.25,1.0,0.03,8.20
110,108,0.15,0.25,0.04,2.15
95,95,0.3,0.5,0.02,6.75
105,110,0.22,0.75,0.045,9.12
85,80,0.28,0.2,0.025,1.35
120,115,0.18,1.2,0.06,5.80
100,98,0.25,0.5,0.04,4.25
115,112,0.2,0.8,0.05,6.40
95,100,0.3,0.3,0.03,8.90
100,102,0.2,0.5,0.05,5.10
90,88,0.25,1.0,0.03,4.50
110,112,0.15,0.25,0.04,4.75
95,92,0.3,0.5,0.02,3.10
105,100,0.22,0.75,0.045,4.20
85,88,0.28,0.2,0.025,5.85
120,125,0.18,1.2,0.06,12.40
100,100,0.25,0.5,0.04,5.95
115,118,0.2,0.8,0.05,10.20
95,98,0.3,0.3,0.03,7.15`;
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const file = new File([blob], `${type}_sample.csv`, { type: 'text/csv' });
    processCSV(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-black italic tracking-tight">Clean Data</h1>
        <p className="text-zinc-500 font-medium">Auto-profile, impute missing values, and handle cardinality.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
         <div className="relative p-12 rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-6 min-h-[420px] overflow-hidden">
            {csvBytes && (
              <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700 z-10">
                 <CheckCircle2 className="w-16 h-16 text-blue-500" />
                 <p className="text-xl font-bold italic">{csvBytes.name} Loaded</p>
                 <button onClick={() => setCsvBytes(null)} className="px-6 h-10 bg-white/5 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Replace File</button>
              </div>
            )}
            
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Upload className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold italic">Drag & Drop Dataset</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">Supports CSV. We'll automatically handle encoding, scaling, and feature synthesis during profiling.</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <label className="px-10 h-14 bg-blue-600 text-white rounded-2xl font-black italic hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-3 cursor-pointer">
                <FileText className="w-5 h-5" />
                {loading ? "Analyzing..." : "Select File"}
                <input type="file" className="hidden" accept=".csv" onChange={handleFile} disabled={loading} />
              </label>

              <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-white/5" />
                <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Or Try with Sample Data</span>
                <div className="h-px w-8 bg-white/5" />
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => loadSample('churn')}
                   className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                 >
                   Churn (Classify)
                 </button>
                 <button 
                   onClick={() => loadSample('pricing')}
                   className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-purple-500 hover:border-purple-500/30 transition-all"
                 >
                   Pricing (Regress)
                 </button>
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-800 font-black uppercase tracking-widest">Maximum file size: 5MB</p>
         </div>

         {csvRows.length > 0 && (
           <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.02] space-y-4 overflow-hidden">
             <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Dataset Preview</p>
             <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-white/5 uppercase tracking-widest text-zinc-500 font-black">
                    <tr>
                      {csvHeaders.slice(0, 8).map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="text-zinc-400 font-medium">
                    {csvRows.map((row, i) => (
                      <tr key={i} className="border-t border-white/5">
                        {csvHeaders.slice(0, 8).map(h => <td key={h} className="px-4 py-3 truncate max-w-[150px]">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
