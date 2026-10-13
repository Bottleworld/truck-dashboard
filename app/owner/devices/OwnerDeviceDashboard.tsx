"use client";

import { useEffect, useState } from "react";

type Metrics = {
  active: number;
  last24h: number;
  last7d: number;
  all: number;
  desktop: number;
  mobile: number;
  tablet: number;
  managers: number;
  owner: number;
  updatedAt: string;
};

export default function OwnerDeviceDashboard() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/owner/device-stats", {
          cache: "no-store", credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Could not retrieve device statistics");
        const fresh: Metrics = await response.json();
        if (active) {
          setData(fresh);
          setError("");
        }
      } catch {
        if (active) setError("Statistics are temporarily unavailable. Please try again.");
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const cards = [
    { label: "Active now", value: data?.active, description: "Browsers seen within 5 minutes" },
    { label: "Last 24 hours", value: data?.last24h, description: "Distinct tracked browsers" },
    { label: "Last 7 days", value: data?.last7d, description: "Distinct tracked browsers" },
    { label: "Since tracking started", value: data?.all, description: "Distinct browser cookies" },
  ];

  return (
    <div className="space-y-7">
      {error && <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-amber-800 font-semibold">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <section key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-600">{card.label}</h2>
            <p className="mt-3 text-4xl font-black tabular-nums text-slate-900">{card.value ?? "—"}</p>
            <p className="mt-2 text-xs text-slate-500">{card.description}</p>
          </section>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Last 24h by device type</h2>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Desktop", value: data?.desktop },
            { label: "Mobile", value: data?.mobile },
            { label: "Tablet", value: data?.tablet },
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-slate-100 p-4">
              <p className="font-semibold text-slate-600">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{item.value ?? "—"}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Active signed-in devices</h2>
        <p className="mt-2 text-sm text-slate-600">Signed-in manager and owner browsers seen within 5 minutes.</p>
        <div className="mt-5 flex flex-wrap gap-6">
          <p className="font-semibold text-slate-800">Manager: <strong>{data?.managers ?? "—"}</strong></p>
          <p className="font-semibold text-slate-800">Owner: <strong>{data?.owner ?? "—"}</strong></p>
        </div>
      </section>
      <p className="text-sm text-slate-600">
        {data ? `Updated: ${new Date(data.updatedAt).toLocaleString()} · Auto-refresh: 30 seconds.` : "Loading statistics..."}
        {" "}Numbers are estimates, not verified physical device identities. Private browsing, cleared cookies or a different browser can be counted as separate devices. No raw IP addresses are retained.
      </p>
    </div>
  );
}
