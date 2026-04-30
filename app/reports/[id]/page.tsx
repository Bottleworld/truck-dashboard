"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    const { data: sessionData, error: sessionError } = await supabase
      .from("truck_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (sessionError) {
      alert("Error loading report");
      console.error(sessionError);
      return;
    }

    const { data: bagData, error: bagError } = await supabase
      .from("bag_counts")
      .select("*")
      .eq("session_id", id)
      .order("bag_number", { ascending: true });

    if (bagError) {
      alert("Error loading bags");
      console.error(bagError);
      return;
    }

    setSession(sessionData);
    setBags(bagData || []);
  }

  function startEdit() {
    const password = prompt("Enter admin password to edit:");
    if (!password) return;

    setAdminPassword(password);
    setEditMode(true);
  }

  function updateBag(index: number, value: string) {
    const newBags = [...bags];
    newBags[index].bottle_count = Number(value);
    setBags(newBags);
  }

  async function saveChanges() {
    const res = await fetch("/api/admin/update-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: id,
        password: adminPassword,
        bags,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Error updating report");
      return;
    }

    alert("Report updated successfully!");
    setEditMode(false);
    setAdminPassword("");
    loadReport();
  }

  function downloadPDF() {
    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("BOTTLE WORLD", 20, 20);

    pdf.setFontSize(14);
    pdf.text("Truck Receiving Invoice", 20, 30);

    pdf.setFontSize(12);
    pdf.text(`Truck: #${session.truck_id}`, 20, 45);
    pdf.text(`Manager: ${session.manager_name}`, 20, 55);
    pdf.text(`Arrival Time: ${session.arrival_time}`, 20, 65);
    pdf.text(`Date: ${new Date(session.created_at).toLocaleString()}`, 20, 75);

    pdf.setFontSize(14);
    pdf.text("Bag Details", 20, 95);

    let y = 108;

    bags.forEach((bag) => {
      pdf.setFontSize(12);
      pdf.text(`Bag #${bag.bag_number}`, 20, y);
      pdf.text(`${bag.bottle_count}`, 170, y);
      y += 9;

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    y += 10;

    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    const totalBags = bags.filter((bag) => Number(bag.bottle_count) > 0).length;
    const totalBottles = bags.reduce(
      (sum, bag) => sum + Number(bag.bottle_count || 0),
      0
    );

    pdf.setFontSize(14);
    pdf.text(`Total Bags: ${editMode ? totalBags : session.total_bags}`, 20, y);
    pdf.text(
      `Total Bottles: ${editMode ? totalBottles : session.total_bottles}`,
      20,
      y + 10
    );

    pdf.save(`truck-${session.truck_id}-report.pdf`);
  }

  function printInvoice() {
    window.print();
  }

  if (!session) return <div className="p-10 text-xl">Loading...</div>;

  const totalBags = bags.filter((bag) => Number(bag.bottle_count) > 0).length;
  const totalBottles = bags.reduce(
    (sum, bag) => sum + Number(bag.bottle_count || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="no-print mb-6 flex gap-4 items-center">
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
            className="bg-green-600 text-white px-5 py-3 rounded-xl"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
        <div className="border-b pb-6 mb-6">
          <h1 className="text-4xl font-bold">BOTTLE WORLD</h1>
          <p className="text-gray-600 mt-2">Truck Receiving Invoice</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-gray-600">Truck</p>
            <p className="text-2xl font-bold">Truck #{session.truck_id}</p>
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

        <h2 className="text-2xl font-bold mb-4">Bag Details</h2>

        <div className="border rounded-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4">Bag #</th>
                <th className="text-right p-4">Bottle Count</th>
              </tr>
            </thead>

            <tbody>
              {bags.map((bag, index) => (
                <tr key={bag.id} className="border-t">
                  <td className="p-4">Bag #{bag.bag_number}</td>
                  <td className="p-4 text-right font-bold">
                    {editMode ? (
                      <input
                        type="number"
                        value={bag.bottle_count || ""}
                        onChange={(e) => updateBag(index, e.target.value)}
                        className="border p-3 rounded-xl text-xl text-right w-40"
                      />
                    ) : (
                      bag.bottle_count
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t pt-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600">Total Bags</p>
            <p className="text-4xl font-bold">
              {editMode ? totalBags : session.total_bags}
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600">Total Bottles</p>
            <p className="text-4xl font-bold">
              {editMode ? totalBottles : session.total_bottles}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <p className="text-gray-600">Manager Signature:</p>
          <div className="h-16 border-b mt-4"></div>
        </div>
      </div>
    </div>
  );
}