"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DayDate = {
  name: string;
  short: string;
  date: string;
};

type WeeklyRow = {
  worker_id: string;
  name: string;
  active: boolean;
  totals: Record<string, number>;
  total: number;
};

const STAFF_PASSCODE = "0909";

export default function WorkersTotalPage() {
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [dayDates, setDayDates] = useState<DayDate[]>([]);
  const [rows, setRows] = useState<WeeklyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWeekly();
  }, []);

  async function loadWeekly() {
    setLoading(true);

    const res = await fetch("/api/admin/workers-weekly");
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error loading weekly total");
      setLoading(false);
      return;
    }

    setWeekStart(data.weekStart);
    setWeekEnd(data.weekEnd);
    setDayDates(data.dayDates || []);
    setRows(data.rows || []);
    setLoading(false);
  }

  function startEdit() {
    const password = prompt("Enter 4 digit passcode:");
    if (!password) return;

    if (password !== STAFF_PASSCODE) {
      alert("Wrong password");
      return;
    }

    setAdminPassword(password);
    setEditMode(true);
  }

  function lockEdit() {
    setAdminPassword("");
    setEditMode(false);
    loadWeekly();
  }

  function updateCell(workerId: string, dayName: string, value: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.worker_id !== workerId) return row;

        const newTotals = {
          ...row.totals,
          [dayName]: Number(value || 0),
        };

        const newTotal = dayDates.reduce(
          (sum, day) => sum + Number(newTotals[day.name] || 0),
          0
        );

        return {
          ...row,
          totals: newTotals,
          total: newTotal,
        };
      })
    );
  }

  async function saveCell(row: WeeklyRow, day: DayDate) {
    const res = await fetch("/api/admin/workers-weekly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: adminPassword,
        workerId: row.worker_id,
        workDate: day.date,
        dayName: day.name,
        bagCount: row.totals?.[day.name] || 0,
        managerName: "Admin",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error saving");
    }
  }

  async function saveAllChanges() {
    if (adminPassword !== STAFF_PASSCODE) {
      alert("Wrong password. Press Admin Edit again.");
      setEditMode(false);
      setAdminPassword("");
      return;
    }

    setSaving(true);

    try {
      for (const row of rows) {
        for (const day of dayDates) {
          await saveCell(row, day);
        }
      }

      alert("Weekly schedule updated!");
      setEditMode(false);
      setAdminPassword("");
      await loadWeekly();
    } catch (error: any) {
      alert(error.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  const grandTotal = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/admin/dashboard" className="text-blue-600 text-lg">
            ← Back to Admin
          </Link>

          <div className="flex gap-3">
            {!editMode ? (
              <button
                onClick={startEdit}
                className="bg-orange-600 text-white px-6 py-3 rounded-xl text-lg font-bold"
              >
                Admin Edit
              </button>
            ) : (
              <>
                <button
                  onClick={saveAllChanges}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg font-bold disabled:bg-gray-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  onClick={lockEdit}
                  disabled={saving}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl text-lg font-bold disabled:bg-gray-400"
                >
                  🔒 Lock
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mt-6">
          <div className="flex justify-between items-end border-b pb-6 mb-8">
            <div>
              <h1 className="text-5xl font-black">Workers Total Schedule</h1>
              <p className="text-xl text-gray-500 mt-2">
                Weekly bag totals by worker
              </p>
            </div>

            <div className="text-right">
              <p className="text-gray-500 text-lg font-bold">From / To</p>
              <p className="text-3xl font-black">
                {weekStart} to {weekEnd}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-xl">Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-5 text-2xl">Name</th>

                    {dayDates.map((day) => (
                      <th key={day.name} className="p-5 text-2xl text-center">
                        {day.short}
                      </th>
                    ))}

                    <th className="p-5 text-2xl text-center bg-green-700">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.worker_id} className="border-t">
                      <td className="p-5 text-2xl font-black bg-gray-50">
                        {row.name}

                        {!row.active && (
                          <span className="ml-3 text-sm text-red-600 font-bold">
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {dayDates.map((day) => (
                        <td key={day.name} className="p-5 text-center">
                          <div className="bg-blue-50 rounded-xl p-4">
                            {editMode ? (
                              <input
                                type="number"
                                value={row.totals?.[day.name] || 0}
                                onChange={(e) =>
                                  updateCell(
                                    row.worker_id,
                                    day.name,
                                    e.target.value
                                  )
                                }
                                className="w-full text-center bg-white border rounded-xl p-2 text-3xl font-black"
                              />
                            ) : (
                              <p className="text-3xl font-black">
                                {row.totals?.[day.name] || 0}
                              </p>
                            )}
                          </div>
                        </td>
                      ))}

                      <td className="p-5 text-center bg-green-50">
                        <p className="text-4xl font-black text-green-700">
                          {row.total || 0}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t bg-slate-100">
                    <td className="p-5 text-2xl font-black">Grand Total</td>

                    {dayDates.map((day) => {
                      const dayTotal = rows.reduce(
                        (sum, row) => sum + Number(row.totals?.[day.name] || 0),
                        0
                      );

                      return (
                        <td key={day.name} className="p-5 text-center">
                          <p className="text-3xl font-black">{dayTotal}</p>
                        </td>
                      );
                    })}

                    <td className="p-5 text-center bg-green-100">
                      <p className="text-4xl font-black text-green-800">
                        {grandTotal}
                      </p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}