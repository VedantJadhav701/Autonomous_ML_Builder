"use client";

import React, { useState } from "react";

export default function UploadSection() {
  const [status, setStatus] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setStatus("Error: Only CSV files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus("Error: File size must be less than 5MB.");
      return;
    }

    setStatus(`Ready to upload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    // Upload logic here if backend supports training endpoint
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold border-b pb-2">Dataset Management</h2>
      <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload CSV Dataset
        </label>
        <input 
          type="file" 
          accept=".csv"
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {status && (
          <p className={`mt-2 text-xs font-medium ${status.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
