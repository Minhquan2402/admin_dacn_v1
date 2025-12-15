"use client";

import React, { useState } from "react";

const AdminApiDebug: React.FC = () => {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${apiBase}/health`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        setStatus(`Error ${res.status}: ${text}`);
      } else {
        const json = await res.json().catch(() => null);
        setStatus(`OK${json ? ` - ${JSON.stringify(json)}` : ""}`);
      }
    } catch (err) {
      setStatus(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-md bg-yellow-50 border border-yellow-100 text-sm text-yellow-900 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">API Debug</div>
          <div className="text-xs text-muted-foreground">NEXT_PUBLIC_API_URL: <span className="font-mono">{apiBase}</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={checkHealth}
            disabled={loading}
            className="px-3 py-1 rounded bg-yellow-400 text-black text-sm font-medium hover:brightness-95"
          >
            {loading ? "Checking..." : "Check /health"}
          </button>
        </div>
      </div>
      {status && <div className="mt-2 text-xs">Status: <span className="font-mono">{status}</span></div>}
    </div>
  );
};

export default AdminApiDebug;
