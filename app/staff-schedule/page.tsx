"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Worker = {
  id: string;
  name: string;
};

type Entry = {
  id: string;
  worker_id: string;
  work_date: string;
  day_name: string;
  bag_count: number;
  edited_by?: string;
  created_at: string;
};

const STAFF_PASSCODE = "0909";

export default function StaffSchedulePage() {
  const [date, setDate] = useState("");
  const [dayName, setDayName] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [managerName, setManagerName] = useState("");
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [draftCounts, setDraftCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setManagerName(localStorage.getItem("managerName") || "");
    loadSchedule();
  }, []);

  async function loadSchedule() {
    const res = await fetch("/api/admin/workers-schedule");
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error loading schedule");
      return;
    }

    setDate(data.date);
    setDayName(data.dayName);
    setWorkers(data.workers || []);
    setEntries(data.entries || []);
  }

  function startEdit() {
    const code = prompt("Enter 4 digit passcode:");
    if (!code) return;

    if (code !== STAFF_PASSCODE) {
      alert("Wrong passcode");
      return;
    }

    setPasscode(code);
    setEditMode(true);
  }

  function lockSchedule() {
    setPasscode("");
    setEditMode(false);
    setDraftCounts({});
  }

  function getEntriesForWorker(workerId: string) {
    return entries.filter((entry) => entry.worker_id === workerId);
  }

  function getWorkerTotal(workerId: string) {
    return getEntriesForWorker(workerId).reduce(
      (sum, entry) => sum + Number(entry.bag_count || 0),
      0
    );
  }

  const totalBagsToday = useMemo(() => {
    return entries.reduce((sum, entry) => sum + Number(entry.bag_count || 0), 0);
  }, [entries]);

  async function addEntry(workerId: string) {
    const value = draftCounts[workerId];

    if (!value || Number(value) <= 0) {
      alert("Enter bag count first.");
      return;
    }

    if (passcode !== STAFF_PASSCODE) {
      alert("Wrong passcode. Press EDIT again.");
      setEditMode(false);
      setPasscode("");
      return;
    }

    setSavingWorkerId(workerId);

    try {
      const res = await fetch("/api/admin/workers-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passcode,
          workerId,
          bagCount: value,
          managerName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error saving entry");
        setSavingWorkerId(null);
        return;
      }

      setDraftCounts((prev) => ({ ...prev, [workerId]: "" }));
      await loadSchedule();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving.");
    } finally {
      setSavingWorkerId(null);
    }
  }

  function formatStamp(dateString: string) {
    const dateObj = new Date(dateString);

    return {
      date: dateObj.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "2-digit",
        day: "2-digit",
      }),
      time: dateObj.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="max-w-[1500px] mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-blue-600 text-xl font-bold">
            ← Back to Admin
          </Link>

          <div className="flex gap-3">
            {!editMode ? (
              <button
                onClick={startEdit}
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl text-2xl font-black shadow"
              >
                EDIT
              </button>
            ) : (
              <button
                onClick={lockSchedule}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-2xl font-black shadow"
              >
                🔒 LOCK
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border p-8">
          <div className="flex justify-between items-end border-b pb-6 mb-6">
            <div>
              <h1 className="text-5xl font-black">Workers Bag Schedule</h1>
              <p className="text-xl text-slate-500 mt-2">
                Each cell is saved with automatic time stamp.
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-slate-500">{dayName}</p>
              <p className="text-5xl font-black">{date}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border">
            <table className="w-full min-w-[1200px] text-left">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-5 text-2xl w-[220px]">Name</th>
                  <th className="p-5 text-2xl">Bag Entries</th>
                  <th className="p-5 text-2xl text-center w-[180px]">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {workers.map((worker) => {
                  const workerEntries = getEntriesForWorker(worker.id);
                  const workerTotal = getWorkerTotal(worker.id);

                  return (
                    <tr key={worker.id} className="border-t bg-white">
                      <td className="p-5 text-3xl font-black align-top">
                        {worker.name}
                      </td>

                      <td className="p-5 align-top">
                        <div className="flex flex-wrap gap-3">
                          {workerEntries.map((entry) => {
                            const stamp = formatStamp(entry.created_at);

                            return (
                              <div
                                key={entry.id}
                                className="w-28 min-h-24 border-2 border-slate-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center shadow-sm"
                              >
                                <p className="text-3xl font-black">
                                  {entry.bag_count}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {stamp.date}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {stamp.time}
                                </p>
                              </div>
                            );
                          })}

                          {editMode && (
                            <div className="w-36 min-h-24 border-2 border-blue-400 rounded-2xl bg-blue-50 p-2 flex flex-col gap-2">
                              <input
                                type="number"
                                inputMode="numeric"
                                value={draftCounts[worker.id] || ""}
                                onChange={(e) =>
                                  setDraftCounts((prev) => ({
                                    ...prev,
                                    [worker.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addEntry(worker.id);
                                  }
                                }}
                                className="w-full text-center border rounded-xl p-2 text-2xl font-black"
                                placeholder="0"
                                autoComplete="off"
                              />

                              <button
                                onClick={() => addEntry(worker.id)}
                                disabled={savingWorkerId === worker.id}
                                className="bg-blue-600 text-white rounded-xl py-2 font-bold disabled:bg-gray-400"
                              >
                                {savingWorkerId === worker.id ? "..." : "ADD"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-5 text-center align-top">
                        <span className="text-5xl font-black">
                          {workerTotal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-blue-50 rounded-3xl p-8">
              <p className="text-2xl text-blue-700 font-bold">
                Total Bags Today
              </p>
              <p className="text-6xl font-black mt-2">{totalBagsToday}</p>
            </div>

            <div className="bg-green-50 rounded-3xl p-8">
              <p className="text-2xl text-green-700 font-bold">Status</p>
              <p className="text-5xl font-black mt-2">
                {editMode ? "EDIT MODE" : "LOCKED 🔒"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}