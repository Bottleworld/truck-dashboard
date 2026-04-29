"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TruckPage() {
  const params = useParams();
  const id = params.id as string;

  const [arrivalTime, setArrivalTime] = useState("");
  const [managerName, setManagerName] = useState("");
  const [bags, setBags] = useState<number[]>([0]);
  const [saved, setSaved] = useState(false);

  const totalBottles = bags.reduce((sum, count) => sum + Number(count || 0), 0);
  const totalBags = bags.filter((bag) => bag > 0).length;
  const today = new Date().toLocaleDateString();

  function updateBag(index: number, value: string) {
    const newBags = [...bags];
    newBags[index] = Number(value);
    setBags(newBags);
    setSaved(false);
  }

  function addBag() {
    setBags([...bags, 0]);
    setSaved(false);
  }

  function removeBag(index: number) {
    const newBags = bags.filter((_, i) => i !== index);
    setBags(newBags.length ? newBags : [0]);
    setSaved(false);
  }

  async function saveReport() {
    if (!arrivalTime || !managerName) {
      alert("Please fill Arrival Time and Manager Name!");
      return;
    }

    const validBags = bags.filter((bag) => bag > 0);

    if (validBags.length === 0) {
      alert("Please enter at least one bag count!");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: session, error: sessionError } = await supabase
      .from("truck_sessions")
      .insert([
        {
          truck_id: id,
          arrival_time: arrivalTime,
          manager_name: managerName,
          total_bags: validBags.length,
          total_bottles: totalBottles,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (sessionError) {
      console.error(sessionError);
      alert("Error saving truck session!");
      return;
    }

    const bagData = validBags.map((count, index) => ({
      session_id: session.id,
      bag_number: index + 1,
      bottle_count: count,
    }));

    const { error: bagError } = await supabase
      .from("bag_counts")
      .insert(bagData);

    if (bagError) {
      console.error(bagError);
      alert("Error saving bag counts!");
      return;
    }

    setSaved(true);
    alert("Report saved to database!");
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="no-print mb-6">
        <a href="/" className="text-blue-600 text-lg">
          ← Back to Trucks
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
        <div className="border-b pb-6 mb-6">
          <h1 className="text-4xl font-bold">BOTTLE WORLD</h1>
          <p className="text-gray-600 mt-2">Truck Receiving Report</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block mb-2 text-lg font-medium">Truck</label>
            <div className="border p-4 rounded-xl text-xl bg-gray-50">
              Truck #{id}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg font-medium">Date</label>
            <div className="border p-4 rounded-xl text-xl bg-gray-50">
              {today}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg font-medium">
              Arrival Time
            </label>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => {
                setArrivalTime(e.target.value);
                setSaved(false);
              }}
              className="border p-4 rounded-xl text-xl w-full"
            />
          </div>

          <div>
            <label className="block mb-2 text-lg font-medium">
              Manager Name
            </label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => {
                setManagerName(e.target.value);
                setSaved(false);
              }}
              placeholder="Enter manager name"
              className="border p-4 rounded-xl text-xl w-full"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Bag Counts</h2>

        <div className="space-y-3 mb-6">
          {bags.map((bag, index) => (
            <div key={index} className="flex gap-3 items-center">
              <span className="text-lg w-24">Bag #{index + 1}</span>

              <input
                type="number"
                placeholder="Bottle count"
                value={bag === 0 ? "" : bag}
                onChange={(e) => updateBag(index, e.target.value)}
                className="border p-4 rounded-xl text-xl flex-1"
              />

              <button
                onClick={() => removeBag(index)}
                className="no-print bg-red-500 text-white px-4 py-3 rounded-xl"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="no-print flex gap-4 mb-8">
          <button
            onClick={addBag}
            className="bg-green-600 text-white px-6 py-4 rounded-xl text-xl"
          >
            + Add Bag
          </button>

          <button
            onClick={saveReport}
            className="bg-blue-600 text-white px-6 py-4 rounded-xl text-xl"
          >
            Save Report
          </button>

          <button
            onClick={printInvoice}
            className="bg-black text-white px-6 py-4 rounded-xl text-xl"
          >
            Print Invoice
          </button>
        </div>

        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-600">Total Bags</p>
              <p className="text-3xl font-bold">{totalBags}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-600">Total Bottles</p>
              <p className="text-3xl font-bold">{totalBottles}</p>
            </div>
          </div>
        </div>

        {saved && (
          <p className="no-print mt-6 text-green-600 text-xl font-bold">
            ✅ Report saved to database
          </p>
        )}

        <div className="mt-10 border-t pt-6">
          <p className="text-gray-600">Manager Signature:</p>
          <div className="h-16 border-b mt-4"></div>
        </div>
      </div>
    </div>
  );
}