"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("managerLoggedIn");

    if (!loggedIn) {
      router.push("/");
      return;
    }

    loadHistory();
  }, [router]);

  async function loadHistory() {
    const { data, error } = await supabase
      .from("truck_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Error loading history");
      return;
    }

    setSessions(data || []);
  }

  async function deleteReport(id: string) {
    const password = prompt("Enter admin password to delete:");
    if (!password) return;

    const confirmDelete = confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    setDeletingId(id);

    try {
      const res = await fetch("/api/admin/delete-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          id,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Error deleting report");
        setDeletingId(null);
        return;
      }

      alert("Report deleted successfully!");
      loadHistory();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 text-lg">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mt-6 mb-6">History</h1>

        {sessions.length === 0 ? (
          <p className="text-xl text-gray-500">No history yet.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-6 rounded-2xl shadow"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {session.is_custom_truck
                        ? `Customer: ${session.customer_name || "N/A"}`
                        : `Truck #${session.truck_id}`}
                    </h2>

                    <p className="text-gray-500">
                      Manager: {session.manager_name}
                    </p>

                    <p className="text-gray-500">
                      Arrival: {session.arrival_time}
                    </p>

                    {session.notes && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <p className="text-sm font-bold text-yellow-800 mb-1">
                          📝 Notes
                        </p>

                        <p className="text-gray-700 whitespace-pre-wrap break-words">
                          {session.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-gray-400 text-sm">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <p className="text-blue-700">Bottles</p>
                    <p className="text-2xl font-bold">
                      {session.total_bottles || 0}
                    </p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl text-center">
                    <p className="text-amber-700">Glass</p>
                    <p className="text-2xl font-bold">
                      {session.total_glass || 0}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-xl text-center">
                    <p className="text-red-700">GARBAGE</p>
                    <p className="text-2xl font-bold">
                      {session.total_trash || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <p className="text-green-700">STRAIGHT</p>
                    <p className="text-2xl font-bold">
                      {session.total_straight || 0}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <p className="text-purple-700">Case</p>
                    <p className="text-2xl font-bold">
                      {session.total_case || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-between items-center gap-3">
                  <p className="text-gray-600">
                    Total Rows: {session.total_bags || 0}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href={`/reports/${session.id}`}
                      className="bg-black text-white px-4 py-2 rounded-lg"
                    >
                      View Report
                    </Link>

                    <Link
                      href={`/reports/${session.id}`}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                      Admin Edit
                    </Link>

                    <button
                      onClick={() => deleteReport(session.id)}
                      disabled={deletingId === session.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
                    >
                      {deletingId === session.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}