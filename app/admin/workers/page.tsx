"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Worker = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
};

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadWorkers();
  }, []);

  async function loadWorkers() {
    const res = await fetch("/api/admin/workers");
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error loading workers");
      return;
    }

    setWorkers(data.workers || []);
  }

  async function addWorker() {
    const password = prompt("Enter admin password:");
    if (!password) return;

    if (!newName.trim()) {
      alert("Enter worker name");
      return;
    }

    const res = await fetch("/api/admin/workers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
        name: newName.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error adding worker");
      return;
    }

    setNewName("");
    loadWorkers();
  }

  async function toggleWorker(worker: Worker) {
    const password = prompt("Enter admin password:");
    if (!password) return;

    const res = await fetch("/api/admin/workers", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
        id: worker.id,
        active: !worker.active,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error updating worker");
      return;
    }

    loadWorkers();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/dashboard" className="text-blue-600 text-lg">
          ← Back to Admin
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 mt-6">
          <h1 className="text-4xl font-black mb-6">Manage Workers</h1>

          <div className="flex gap-3 mb-8">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Worker name"
              className="flex-1 border p-4 rounded-xl text-xl"
            />

            <button
              onClick={addWorker}
              className="bg-green-600 text-white px-6 py-4 rounded-xl text-xl font-bold"
            >
              + Add Worker
            </button>
          </div>

          <div className="space-y-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="border rounded-2xl p-5 flex justify-between items-center"
              >
                <div>
                  <p className="text-2xl font-bold">{worker.name}</p>
                  <p
                    className={`font-bold ${
                      worker.active ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {worker.active ? "Active" : "Inactive"}
                  </p>
                </div>

                <button
                  onClick={() => toggleWorker(worker)}
                  className={`px-5 py-3 rounded-xl text-white font-bold ${
                    worker.active ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {worker.active ? "Remove from Schedule" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}