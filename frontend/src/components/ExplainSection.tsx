"use client";

import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ExplainSection() {
  const [loading, setLoading] = useState(false);
  const [explanations, setExplanations] = useState<any[] | null>(null);

  const handleExplain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numbers
    const payload = {
      data: [{
        ...data,
        age: Number(data.age),
        income: Number(data.income),
        loan_amnt: Number(data.loan_amnt),
        loan_int_rate: Number(data.loan_int_rate),
        emp_length: Number(data.emp_length),
        loan_percent_income: Number(data.loan_percent_income),
        cb_person_cred_hist_length: Number(data.cb_person_cred_hist_length)
      }]
    };

    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      setExplanations(result.explainability);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold border-b pb-2">Model Explainability (SHAP)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleExplain} className="lg:col-span-1 space-y-3">
          <Input label="Age" name="age" defaultValue="25" />
          <Input label="Income" name="income" defaultValue="50000" />
          <Input label="Loan Amount" name="loan_amnt" defaultValue="10000" />
          <Input label="Interest Rate" name="loan_int_rate" defaultValue="10.5" />
          <button type="submit" disabled={loading} className="w-full py-2 bg-zinc-800 text-white rounded text-sm font-semibold hover:bg-zinc-700">
            {loading ? "Calculating..." : "Generate SHAP Report"}
          </button>
        </form>
        
        <div className="lg:col-span-2 border rounded-lg overflow-hidden border-gray-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 uppercase font-bold">
              <tr>
                <th className="px-4 py-2">Feature Name</th>
                <th className="px-4 py-2 text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {explanations ? (
                Object.entries(explanations[0]).map(([name, val]: any) => (
                  <tr key={name}>
                    <td className="px-4 py-2 font-mono text-[10px] text-gray-600 dark:text-gray-400">{name}</td>
                    <td className={`px-4 py-2 text-right font-bold ${val > 0 ? "text-green-600" : "text-red-600"}`}>
                      {val.toFixed(4)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400 italic">No data analyzed</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Input({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      <input 
        name={name} 
        defaultValue={defaultValue}
        className="w-full px-3 py-1.5 border rounded text-sm bg-white dark:bg-black border-gray-200 dark:border-zinc-800 focus:outline-none"
      />
    </div>
  );
}
