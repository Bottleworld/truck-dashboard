"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";

type CountType = "bottle" | "glass" | "garbich" | "straight" | "case";

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from("truck_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (sessionError) {
      alert("Error loading report");
      setLoading(false);
      return;
    }

    const { data: bagData, error: bagError } = await supabase
      .from("bag_counts")
      .select("*")
      .eq("session_id", id)
      .order("bag_number", { ascending: true });

    if (bagError) {
      alert("Error loading bag counts");
      setLoading(false);
      return;
    }

    setSession(sessionData);
    setBags(bagData || []);
    setLoading(false);
  }

  function printInvoice() {
    window.print();
  }

  function getItemTypeAndCount(bag: any) {
    if ((bag.bottle_count || 0) > 0) {
      return { type: "Bottle ♻️", count: bag.bottle_count };
    }

    if ((bag.glass_count || 0) > 0) {
      return { type: "Glass 🍾", count: bag.glass_count };
    }

    if ((bag.trash_count || 0) > 0) {
      return { type: "GARBAGE 🗑️", count: bag.trash_count };
    }

    if ((bag.straight_count || 0) > 0) {
      return { type: "STRAIGHT ✅", count: bag.straight_count };
    }

    if ((bag.case_count || 0) > 0) {
      return { type: "Case 📦", count: bag.case_count };
    }

    return { type: "Empty", count: 0 };
  }

  function getBagType(bag: any): CountType {
    if ((bag.glass_count || 0) > 0) return "glass";
    if ((bag.trash_count || 0) > 0) return "garbich";
    if ((bag.straight_count || 0) > 0) return "straight";
    if ((bag.case_count || 0) > 0) return "case";
    return "bottle";
  }

  function getBagCount(bag: any) {
    return (
      bag.bottle_count ||
      bag.glass_count ||
      bag.trash_count ||
      bag.straight_count ||
      bag.case_count ||
      0
    );
  }

  function updateBagType(index: number, type: CountType) {
    setBags((prev) => {
      const next = [...prev];
      const count = getBagCount(next[index]);

      next[index] = {
        ...next[index],
        bottle_count: type === "bottle" ? count : 0,
        glass_count: type === "glass" ? count : 0,
        trash_count: type === "garbich" ? count : 0,
        straight_count: type === "straight" ? count : 0,
        case_count: type === "case" ? count : 0,
      };

      return next;
    });
  }

  function updateBagCount(index: number, value: string) {
    setBags((prev) => {
      const next = [...prev];
      const type = getBagType(next[index]);
      const count = Number(value || 0);

      next[index] = {
        ...next[index],
        bottle_count: type === "bottle" ? count : 0,
        glass_count: type === "glass" ? count : 0,
        trash_count: type === "garbich" ? count : 0,
        straight_count: type === "straight" ? count : 0,
        case_count: type === "case" ? count : 0,
      };

      return next;
    });
  }

  function startEdit() {
    const password = prompt("Enter admin password:");
    if (!password) return;

    localStorage.setItem("reportEditPassword", password);
    setEditMode(true);
  }

  async function saveChanges() {
    const password = localStorage.getItem("reportEditPassword");

    if (!password) {
      alert("Admin password missing");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/update-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          sessionId: id,
          bags,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Error updating report");
        setSaving(false);
        return;
      }

      alert("Report updated successfully!");
      setEditMode(false);
      localStorage.removeItem("reportEditPassword");
      loadReport();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating.");
    } finally {
      setSaving(false);
    }
  }

  function downloadPDF() {
    if (!session) return;

    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("BOTTLE WORLD", 20, 20);

    pdf.setFontSize(14);
    pdf.text("Receiving Report", 20, 30);

    pdf.setFontSize(12);

    pdf.text(
      session.is_custom_truck
        ? `Customer: ${session.customer_name || "N/A"}`
        : `Truck: #${session.truck_id}`,
      20,
      45
    );

    pdf.text(`Manager: ${session.manager_name}`, 20, 55);
    pdf.text(`Arrival Time: ${session.arrival_time}`, 20, 65);
    pdf.text(`Date: ${new Date(session.created_at).toLocaleString()}`, 20, 75);

    pdf.setFontSize(14);
    pdf.text("Item Details", 20, 95);

    let y = 108;

    bags.forEach((bag) => {
      const item = getItemTypeAndCount(bag);

      pdf.setFontSize(12);
      pdf.text(`#${bag.bag_number} - ${item.type}`, 20, y);
      pdf.text(String(item.count), 170, y);

      y += 9;

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    y += 10;

    if (y > 230) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(14);
    pdf.text(`Total Rows: ${session.total_bags || 0}`, 20, y);
    pdf.text(`Total Bottles: ${session.total_bottles || 0}`, 20, y + 10);
    pdf.text(`Total Glass: ${session.total_glass || 0}`, 20, y + 20);
    pdf.text(`Total GARBAGE: ${session.total_trash || 0}`, 20, y + 30);
    pdf.text(`Total STRAIGHT: ${session.total_straight || 0}`, 20, y + 40);
    pdf.text(`Total Case: ${session.total_case || 0}`, 20, y + 50);

    pdf.save(
      session.is_custom_truck
        ? `customer-${session.customer_name}-report.pdf`
        : `truck-${session.truck_id}-report.pdf`
    );
  }

  const totalRows = bags.filter((bag) => getBagCount(bag) > 0).length;

  const totalBottles = bags.reduce(
    (sum, bag) => sum + Number(bag.bottle_count || 0),
    0
  );

  const totalGlass = bags.reduce(
    (sum, bag) => sum + Number(bag.glass_count || 0),
    0
  );

  const totalGarbich = bags.reduce(
    (sum, bag) => sum + Number(bag.trash_count || 0),
    0
  );

  const totalStraight = bags.reduce(
    (sum, bag) => sum + Number(bag.straight_count || 0),
    0
  );

  const totalCase = bags.reduce(
    (sum, bag) => sum + Number(bag.case_count || 0),
    0
  );

  if (loading) {
    return <div className="p-10 text-xl">Loading...</div>;
  }

  if (!session) {
    return <div className="p-10 text-xl">Report not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="no-print mb-6 flex gap-4 items-center flex-wrap">
        <Link href="/history" className="text-blue-600 text-lg">
          ← Back to History
        </Link>

        <button
          onClick={downloadPDF}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Download PDF
        </button>

        <button
          onClick={printInvoice}
          className="bg-gray-700 text-white px-5 py-3 rounded-xl"
        >
          Print
        </button>

        {!editMode ? (
          <button
            onClick={startEdit}
            className="bg-orange-600 text-white px-5 py-3 rounded-xl"
          >
            Admin Edit
          </button>
        ) : (
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-green-600 text-white px-5 py-3 rounded-xl disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl mx-auto">
        <div className="border-b pb-6 mb-6">
          <h1 className="text-4xl font-bold">BOTTLE WORLD</h1>
          <p className="text-gray-600 mt-2">Receiving Report</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-gray-600">
              {session.is_custom_truck ? "Customer" : "Truck"}
            </p>
            <p className="text-2xl font-bold">
              {session.is_custom_truck
                ? session.customer_name || "N/A"
                : `Truck #${session.truck_id}`}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Date</p>
            <p className="text-2xl font-bold">
              {new Date(session.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Arrival Time</p>
            <p className="text-2xl font-bold">{session.arrival_time}</p>
          </div>

          <div>
            <p className="text-gray-600">Manager</p>
            <p className="text-2xl font-bold">{session.manager_name}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Item Details</h2>

        <div className="border rounded-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Type</th>
                <th className="text-right p-4">Count</th>
              </tr>
            </thead>

            <tbody>
              {bags.map((bag, index) => {
                const item = getItemTypeAndCount(bag);

                return (
                  <tr key={bag.id} className="border-t">
                    <td className="p-4 font-bold">#{bag.bag_number}</td>

                    <td className="p-4">
                      {editMode ? (
                        <select
                          value={getBagType(bag)}
                          onChange={(e) =>
                            updateBagType(index, e.target.value as CountType)
                          }
                          className="border p-3 rounded-xl font-bold"
                        >
                          <option value="bottle">Bottle ♻️</option>
                          <option value="glass">Glass 🍾</option>
                          <option value="garbich">GARBAGE 🗑️</option>
                          <option value="straight">STRAIGHT ✅</option>
                          <option value="case">Case 📦</option>
                        </select>
                      ) : (
                        item.type
                      )}
                    </td>

                    <td className="p-4 text-right font-bold">
                      {editMode ? (
                        <input
                          type="number"
                          value={getBagCount(bag)}
                          onChange={(e) =>
                            updateBagCount(index, e.target.value)
                          }
                          className="border p-3 rounded-xl text-right w-32 font-bold"
                        />
                      ) : (
                        item.count
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 border-t pt-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600">Total Rows</p>
            <p className="text-4xl font-bold">
              {editMode ? totalRows : session.total_bags || 0}
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl">
            <p className="text-blue-700">Total Bottles</p>
            <p className="text-4xl font-bold">
              {editMode ? totalBottles : session.total_bottles || 0}
            </p>
          </div>

          <div className="bg-amber-50 p-6 rounded-xl">
            <p className="text-amber-700">Total Glass</p>
            <p className="text-4xl font-bold">
              {editMode ? totalGlass : session.total_glass || 0}
            </p>
          </div>

          <div className="bg-red-50 p-6 rounded-xl">
            <p className="text-red-700">Total GARBAGE</p>
            <p className="text-4xl font-bold">
              {editMode ? totalGarbich : session.total_trash || 0}
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <p className="text-green-700">Total STRAIGHT</p>
            <p className="text-4xl font-bold">
              {editMode ? totalStraight : session.total_straight || 0}
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <p className="text-purple-700">Total Case</p>
            <p className="text-4xl font-bold">
              {editMode ? totalCase : session.total_case || 0}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <p className="text-gray-600">Manager Signature:</p>
          <div className="h-16 border-b mt-4 font-bold text-2xl flex items-end pb-2">
            {session.manager_name}
          </div>
        </div>
      </div>
    </div>
  );
}