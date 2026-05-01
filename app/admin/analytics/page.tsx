"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Session = {
  id: string;
  truck_id: string;
  manager_name: string;
  total_bags: number;
  total_bottles: number;
  created_at: string;
};

export default function AdminAnalyticsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);

    const { data, error } = await supabase
      .from("truck_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading analytics");
      setLoading(false);
      return;
    }

    setSessions(data || []);
    setLoading(false);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at) >= today
  );

  const weekSessions = sessions.filter(
    (s) => new Date(s.created_at) >= weekAgo
  );

  const monthSessions = sessions.filter(
    (s) => new Date(s.created_at) >= monthAgo
  );

  function totalBags(rows: Session[]) {
    return rows.reduce((sum, s) => sum + (s.total_bags || 0), 0);
  }

  function totalBottles(rows: Session[]) {
    return rows.reduce((sum, s) => sum + (s.total_bottles || 0), 0);
  }

  const topTrucks = Object.values(
    sessions.reduce((acc: any, session) => {
      if (!acc[session.truck_id]) {
        acc[session.truck_id] = {
          truck_id: session.truck_id,
          trips: 0,
          bags: 0,
          bottles: 0,
        };
      }

      acc[session.truck_id].trips += 1;
      acc[session.truck_id].bags += session.total_bags || 0;
      acc[session.truck_id].bottles += session.total_bottles || 0;

      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b.bottles - a.bottles)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/dashboard" className="text-blue-600 text-lg">
          ← Back to Admin
        </Link>

        <h1 className="text-4xl font-bold mt-6 mb-8">📊 Analytics</h1>

        {loading ? (
          <p className="text-xl">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow p-6">
                <p className="text-gray-500">Today Bottles</p>
                <p className="text-5xl font-bold mt-2">
                  {totalBottles(todaySessions)}
                </p>
                <p className="text-gray-500 mt-2">
                  Bags: {totalBags(todaySessions)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <p className="text-gray-500">Last 7 Days Bottles</p>
                <p className="text-5xl font-bold mt-2">
                  {totalBottles(weekSessions)}
                </p>
                <p className="text-gray-500 mt-2">
                  Bags: {totalBags(weekSessions)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <p className="text-gray-500">Last 30 Days Bottles</p>
                <p className="text-5xl font-bold mt-2">
                  {totalBottles(monthSessions)}
                </p>
                <p className="text-gray-500 mt-2">
                  Bags: {totalBags(monthSessions)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">🏆 Top Trucks</h2>

              {topTrucks.length === 0 ? (
                <p className="text-gray-500">No data yet.</p>
              ) : (
                <div className="space-y-4">
                  {topTrucks.map((truck: any, index) => (
                    <div
                      key={truck.truck_id}
                      className="border rounded-xl p-5 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-2xl font-bold">
                          #{index + 1} — Truck {truck.truck_id}
                        </p>
                        <p className="text-gray-500">Trips: {truck.trips}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl">Bags: {truck.bags}</p>
                        <p className="text-3xl font-bold">
                          Bottles: {truck.bottles}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Reports</h2>

              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="border-b py-4 flex justify-between"
                >
                  <div>
                    <p className="font-bold">Truck {session.truck_id}</p>
                    <p className="text-gray-500">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                    <p className="text-gray-500">
                      Manager: {session.manager_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p>Bags: {session.total_bags}</p>
                    <p className="font-bold">
                      Bottles: {session.total_bottles}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}