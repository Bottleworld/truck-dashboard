"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Session = {
  id: string;
  truck_id: string;
  manager_name: string;
  total_bags: number;
  total_bottles: number;
  total_glass: number;
  total_trash: number;
  total_straight: number;
  total_case: number;
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

  function sum(rows: Session[], key: keyof Session) {
    return rows.reduce((total, s) => total + Number(s[key] || 0), 0);
  }

  function totalBags(rows: Session[]) {
    return rows.reduce((total, s) => total + Number(s.total_bags || 0), 0);
  }

  function getTruckName(session: Session) {
    return session.truck_id === "CUSTOM"
      ? "Truck CUSTOM"
      : `Truck ${session.truck_id}`;
  }

  const chartMap: Record<string, any> = {};

  sessions.forEach((session) => {
    const date = new Date(session.created_at).toLocaleDateString();

    if (!chartMap[date]) {
      chartMap[date] = {
        date,
        total: 0,
      };
    }

    chartMap[date].total +=
      Number(session.total_bottles || 0) +
      Number(session.total_glass || 0) +
      Number(session.total_trash || 0) +
      Number(session.total_straight || 0) +
      Number(session.total_case || 0);
  });

  const chartData = Object.values(chartMap).reverse();

  function getBarColor(value: number) {
    if (value < 1000) return "#ef4444"; // red
    if (value < 5000) return "#facc15"; // yellow
    return "#22c55e"; // green
  }

  const topTrucks = Object.values(
    sessions.reduce((acc: any, session) => {
      if (!acc[session.truck_id]) {
        acc[session.truck_id] = {
          truck_id: session.truck_id,
          trips: 0,
          bags: 0,
          bottles: 0,
          glass: 0,
          garbage: 0,
          straight: 0,
          case: 0,
          total: 0,
        };
      }

      acc[session.truck_id].trips += 1;
      acc[session.truck_id].bags += session.total_bags || 0;
      acc[session.truck_id].bottles += session.total_bottles || 0;
      acc[session.truck_id].glass += session.total_glass || 0;
      acc[session.truck_id].garbage += session.total_trash || 0;
      acc[session.truck_id].straight += session.total_straight || 0;
      acc[session.truck_id].case += session.total_case || 0;

      acc[session.truck_id].total =
        acc[session.truck_id].bottles +
        acc[session.truck_id].glass +
        acc[session.truck_id].garbage +
        acc[session.truck_id].straight +
        acc[session.truck_id].case;

      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin/dashboard" className="text-blue-600 text-lg">
          ← Back to Admin
        </Link>

        <h1 className="text-4xl font-bold mt-6 mb-8">📊 Analytics</h1>

        {loading ? (
          <p className="text-xl">Loading...</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">
                Daily Total Activity
              </h2>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" name="Total Count">
                      {chartData.map((entry: any, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(entry.total)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-6 mt-4 text-sm">
                <p>🔴 Low</p>
                <p>🟡 Medium</p>
                <p>🟢 High</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow p-6">
                <p className="text-gray-500">Today</p>
                <p className="text-3xl font-bold mt-2">
                  Bottles: {sum(todaySessions, "total_bottles")}
                </p>
                <p>Glass: {sum(todaySessions, "total_glass")}</p>
                <p>Garbage: {sum(todaySessions, "total_trash")}</p>
                <p>Straight: {sum(todaySessions, "total_straight")}</p>
                <p>Case: {sum(todaySessions, "total_case")}</p>
                <p className="text-gray-500 mt-2">
                  Bags: {totalBags(todaySessions)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <p className="text-gray-500">Last 7 Days</p>
                <p className="text-3xl font-bold mt-2">
                  Bottles: {sum(weekSessions, "total_bottles")}
                </p>
                <p>Glass: {sum(weekSessions, "total_glass")}</p>
                <p>Garbage: {sum(weekSessions, "total_trash")}</p>
                <p>Straight: {sum(weekSessions, "total_straight")}</p>
                <p>Case: {sum(weekSessions, "total_case")}</p>
                <p className="text-gray-500 mt-2">
                  Bags: {totalBags(weekSessions)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <p className="text-gray-500">Last 30 Days</p>
                <p className="text-3xl font-bold mt-2">
                  Bottles: {sum(monthSessions, "total_bottles")}
                </p>
                <p>Glass: {sum(monthSessions, "total_glass")}</p>
                <p>Garbage: {sum(monthSessions, "total_trash")}</p>
                <p>Straight: {sum(monthSessions, "total_straight")}</p>
                <p>Case: {sum(monthSessions, "total_case")}</p>
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

                      <div className="text-right text-sm">
                        <p>Bags: {truck.bags}</p>
                        <p>Bottles: {truck.bottles}</p>
                        <p>Glass: {truck.glass}</p>
                        <p>Garbage: {truck.garbage}</p>
                        <p>Straight: {truck.straight}</p>
                        <p>Case: {truck.case}</p>
                        <p className="text-2xl font-bold mt-1">
                          Total: {truck.total}
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
                    <p className="font-bold">{getTruckName(session)}</p>
                    <p className="text-gray-500">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                    <p className="text-gray-500">
                      Manager: {session.manager_name}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p>Bags: {session.total_bags}</p>
                    <p>Bottles: {session.total_bottles}</p>
                    <p>Glass: {session.total_glass}</p>
                    <p>Garbage: {session.total_trash}</p>
                    <p>Straight: {session.total_straight}</p>
                    <p>Case: {session.total_case}</p>
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