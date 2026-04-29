"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Session = {
  id: string;
  truck_id: string;
  arrival_time: string;
  manager_name: string;
  total_bags: number;
  total_bottles: number;
  created_at: string;
  expires_at: string;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);

    const { data, error } = await supabase
      .from("truck_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Error loading history");
      setLoading(false);
      return;
    }

    setSessions(data || []);
    setLoading(false);
  }

  async function deleteReport(sessionId: string) {
    const confirmDelete = confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    const password = prompt("Enter admin password to delete:");
    if (!password) return;

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      alert("Wrong password");
      return;
    }

    await supabase.from("bag_counts").delete().eq("session_id", sessionId);
    await supabase.from("truck_sessions").delete().eq("id", sessionId);

    alert("Report deleted successfully!");
    loadHistory();
  }

  function exportCSV() {
    const rows = filteredSessions.map((session) => ({
      Date: new Date(session.created_at).toLocaleString(),
      Truck: `Truck #${session.truck_id}`,
      Manager: session.manager_name,
      Arrival: session.arrival_time,
      Bags: session.total_bags,
      Bottles: session.total_bottles,
      Expires: new Date(session.expires_at).toLocaleDateString(),
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "bottle-world-history.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const filteredSessions = sessions.filter((session) => {
    const text = search.toLowerCase();

    return (
      session.truck_id.toLowerCase().includes(text) ||
      session.manager_name.toLowerCase().includes(text) ||
      new Date(session.created_at).toLocaleDateString().includes(text) ||
      new Date(session.created_at).toLocaleString().toLowerCase().includes(text)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="text-blue-600 text-lg">
          ← Back to Trucks
        </Link>

        <button
          onClick={loadHistory}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">BOTTLE WORLD</h1>
        <p className="text-gray-600 mb-6">Truck Receiving History</p>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Search by truck, manager, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border p-4 rounded-xl text-xl"
          />

          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-6 py-4 rounded-xl text-xl"
          >
            Export Excel
          </button>
        </div>

        {loading ? (
          <p className="text-xl">Loading...</p>
        ) : filteredSessions.length === 0 ? (
          <p className="text-xl text-gray-500">No reports found.</p>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-xl p-5 flex justify-between items-center hover:bg-gray-50"
              >
                <Link href={`/reports/${session.id}`} className="flex-1">
                  <h2 className="text-2xl font-bold">
                    Truck #{session.truck_id}
                  </h2>

                  <p className="text-gray-600">
                    Manager: {session.manager_name}
                  </p>

                  <p className="text-gray-600">
                    Arrival: {session.arrival_time}
                  </p>

                  <p className="text-gray-600">
                    Date: {new Date(session.created_at).toLocaleString()}
                  </p>
                </Link>

                <div className="text-right mr-6">
                  <p className="text-xl">Bags: {session.total_bags}</p>
                  <p className="text-2xl font-bold">
                    Bottles: {session.total_bottles}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Expires: {new Date(session.expires_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => deleteReport(session.id)}
                  className="bg-red-600 text-white px-5 py-3 rounded-xl"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}