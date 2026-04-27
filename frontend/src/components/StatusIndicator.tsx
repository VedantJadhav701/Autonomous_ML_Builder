"use client";

import React, { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function StatusIndicator() {
  const [health, setHealth] = useState<{ status: string; lastPing: string } | null>(null);

  useEffect(() => {
    const check = async () => {
      const start = Date.now();
      try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();
        setHealth({ 
          status: data.status, 
          lastPing: `${Date.now() - start}ms` 
        });
      } catch (e) {
        setHealth({ status: "down", lastPing: "N/A" });
      }
    };
    check();
    const inv = setInterval(check, 10000);
    return () => clearInterval(inv);
  }, []);

  return (
    <div className="flex items-center gap-4 text-xs border p-2 rounded bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <span className="font-semibold uppercase text-gray-500">API:</span>
        <span className={`h-2 w-2 rounded-full ${health?.status === "ok" ? "bg-green-500" : "bg-red-500"}`} />
        <span className="font-mono text-gray-700 dark:text-gray-300">{health?.status || "Checking..."}</span>
      </div>
      <div className="flex items-center gap-2 border-l px-2 border-gray-200 dark:border-zinc-800">
        <span className="font-semibold uppercase text-gray-500">Latency:</span>
        <span className="font-mono text-gray-700 dark:text-gray-300">{health?.lastPing || "--"}</span>
      </div>
    </div>
  );
}
