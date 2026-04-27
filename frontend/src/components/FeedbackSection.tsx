"use client";

import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function FeedbackSection() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const reqId = formData.get("requestId") as string;
    const truth = Number(formData.get("truth"));

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_ids: [reqId], truths: [truth] })
      });
      if (res.ok) setMsg("Success: Feedback logged.");
      else throw new Error();
    } catch (e) {
      setMsg("Error: Failed to log feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold border-b pb-2">Ground Truth Reconciliation</h2>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Request ID</label>
          <input 
            name="requestId" 
            placeholder="e.g. web-req-123"
            className="w-full px-3 py-1.5 border rounded text-sm bg-white dark:bg-black border-gray-200 dark:border-zinc-800 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Label</label>
          <select name="truth" className="w-full px-3 py-1.5 border rounded text-sm bg-white dark:bg-black border-gray-200 dark:border-zinc-800">
            <option value="0">0 (Approve)</option>
            <option value="1">1 (Reject)</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="px-6 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? "..." : "Reconcile"}
        </button>
      </form>
      {msg && <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{msg}</p>}
    </section>
  );
}
