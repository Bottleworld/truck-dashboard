"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Truck = {
  id: string;
  truck_number: number;
  truck_name: string;
};

export default function Home() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [stats, setStats] = useState({ trucks: 0, bags: 0, bottles: 0 });

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    fetchStats();
    fetchTrucks();
  }

  async function fetchStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("truck_sessions")
      .select("*")
      .gte("created_at", today.toISOString());

    const rows = data || [];
    setStats({
      trucks: rows.length,
      bags: rows.reduce((sum, item) => sum + (item.total_bags || 0), 0),
      bottles: rows.reduce((sum, item) => sum + (item.total_bottles || 0), 0),
    });
  }

  async function fetchTrucks() {
    const { data } = await supabase
      .from("trucks")
      .select("id, truck_number, truck_name")
      .order("truck_number", { ascending: true });

    setTrucks(data || []);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[2rem] bg-white/80 backdrop-blur border border-white shadow-xl p-8 mb-8">
          <div className="flex justify-between items-start gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                ● LIVE SYSTEM
              </div>

              <h1 className="text-5xl font-black tracking-tight">
                Bottle World
              </h1>

              <p className="text-xl text-slate-500 mt-2">
                Truck receiving, bottle count, reports, and history.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/history"
                className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow hover:bg-slate-700 transition"
              >
                📋 History
              </Link>

              <Link
                href="/admin"
                className="bg-white text-slate-900 border px-6 py-4 rounded-2xl text-lg font-bold shadow hover:bg-slate-50 transition"
              >
                🔐 Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-white">
            <div className="text-4xl mb-4">🚚</div>
            <p className="text-slate-500 font-semibold">Today Trucks</p>
            <p className="text-5xl font-black mt-2">{stats.trucks}</p>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-white">
            <div className="text-4xl mb-4">🛍️</div>
            <p className="text-slate-500 font-semibold">Today Bags</p>
            <p className="text-5xl font-black mt-2">{stats.bags}</p>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-white">
            <div className="text-4xl mb-4">♻️</div>
            <p className="text-slate-500 font-semibold">Today Bottles</p>
            <p className="text-5xl font-black mt-2">{stats.bottles}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-white p-8">
          <div className="flex justify-between items-end mb-7">
            <div>
              <h2 className="text-3xl font-black">Trucks</h2>
              <p className="text-slate-500 mt-1">
                Tap a truck to start a receiving report.
              </p>
            </div>

            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
              Auto refresh every 5s
            </span>
          </div>

          {trucks.length === 0 ? (
            <div className="border-2 border-dashed rounded-3xl p-12 text-center text-slate-500">
              No trucks found. Add trucks from Admin Panel.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {trucks.map((truck) => (
                <div
                  key={truck.id}
                  className="group flex gap-3 bg-slate-50 rounded-3xl p-3 border hover:shadow-lg transition"
                >
                  <Link
                    href={`/trucks/${truck.truck_number}`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-7 rounded-2xl text-2xl font-black shadow hover:scale-[1.01] transition"
                  >
                    <div className="flex justify-between items-center">
                      <span>🚚 {truck.truck_name}</span>
                      <span className="text-blue-100 text-lg">Start →</span>
                    </div>
                  </Link>

                  <Link
                    href={`/trucks-info/${truck.truck_number}`}
                    className="bg-white hover:bg-slate-100 px-6 flex items-center justify-center rounded-2xl text-3xl border shadow-sm transition"
                  >
                    ⓘ
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}