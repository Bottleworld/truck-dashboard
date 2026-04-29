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
  const [stats, setStats] = useState({
    trucks: 0,
    bags: 0,
    bottles: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchTrucks();
  }, []);

  async function fetchStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("truck_sessions")
      .select("*")
      .gte("created_at", today.toISOString());

    if (error) {
      console.error(error);
      return;
    }

    let trucksCount = data.length;
    let bags = 0;
    let bottles = 0;

    data.forEach((item) => {
      bags += item.total_bags || 0;
      bottles += item.total_bottles || 0;
    });

    setStats({ trucks: trucksCount, bags, bottles });
  }

  async function fetchTrucks() {
    const { data, error } = await supabase
      .from("trucks")
      .select("id, truck_number, truck_name")
      .order("truck_number", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error loading trucks");
      return;
    }

    setTrucks(data || []);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold mb-8">📊 BOTTLE WORLD DASHBOARD</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow text-center">
          <h2 className="text-xl font-semibold">🚚 Today Trucks</h2>
          <p className="text-4xl font-bold">{stats.trucks}</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow text-center">
          <h2 className="text-xl font-semibold">🛍 Today Bags</h2>
          <p className="text-4xl font-bold">{stats.bags}</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow text-center">
          <h2 className="text-xl font-semibold">🍾 Today Bottles</h2>
          <p className="text-4xl font-bold">{stats.bottles}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          href="/history"
          className="bg-black text-white px-6 py-4 rounded-xl text-xl"
        >
          📋 View History
        </Link>

        <Link
          href="/admin"
          className="bg-gray-700 text-white px-6 py-4 rounded-xl text-xl"
        >
          🔐 Admin
        </Link>
      </div>

      <h2 className="text-3xl font-bold mb-6">TRUCKS</h2>

      {trucks.length === 0 ? (
        <p className="text-xl text-gray-500">
          No trucks found. Add trucks from Admin Panel.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {trucks.map((truck) => (
            <div key={truck.id} className="flex gap-2">
              <Link
                href={`/trucks/${truck.truck_number}`}
                className="flex-1 bg-blue-600 text-white p-8 rounded-xl text-2xl shadow"
              >
                🚚 {truck.truck_name}
              </Link>

              <Link
                href={`/trucks-info/${truck.truck_number}`}
                className="bg-gray-800 text-white px-5 flex items-center justify-center rounded-xl text-2xl"
              >
                ⓘ
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}