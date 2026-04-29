"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      alert("Wrong password");
      return;
    }

    setEditMode(true);
  }

  function updateBag(index: number, value: string) {
    const newBags = [...bags];
    newBags[index].bottle_count = Number(value);
    setBags(newBags);
  }

  async function saveChanges() {
    const totalBags = bags.filter((bag) => Number(bag.bottle_count) > 0).length;
    const totalBottles = bags.reduce(
      (sum, bag) => sum + Number(bag.bottle_count || 0),
      0
    );

    for (const bag of bags) {
      const { error } = await supabase
        .from("bag_counts")
        .update({
          bottle_count: Number(bag.bottle_count),
        })
        .eq("id", bag.id);

      if (error) {
        alert("Error saving bag");
        console.error(error);
        return;
      }
    }

    const { error: sessionError } = await supabase
      .from("truck_sessions")
      .update({
        total_bags: totalBags,
        total_bottles: totalBottles,
      })
      .eq("id", id);

    if (sessionError) {
      alert("Error updating report totals");
      console.error(sessionError);
      return;
    }

    alert("Report updated successfully!");
    setEditMode(false);
    loadReport();
  }

  async function downloadPDF() {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
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

      <div
        ref={reportRef}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto"
      >
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