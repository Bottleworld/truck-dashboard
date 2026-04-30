"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Truck = {
  id: string;
  truck_number: number;
  truck_name: string;
  plate_number: string;
  vin: string;
};

export default function AdminTrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    loadTrucks();
  }, []);

  async function loadTrucks() {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .order("truck_number", { ascending: true });

    if (error) {
      alert("Error loading trucks");
      return;
    }

    setTrucks(data || []);
  }

  async function deleteTruck(id: string, name: string) {
    const confirmDelete = confirm(`Delete ${name}?`);
    if (!confirmDelete) return;

    const password = prompt("Enter admin password:");
    if (!password) return;

    const res = await fetch("/api/admin/delete-truck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, id }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Error deleting truck");
      return;
    }

    alert("Truck deleted successfully!");
    loadTrucks();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/admin/dashboard" className="text-blue-600 text-lg">
          ← Back to Admin
        </Link>

        <Link href="/" className="text-blue-600 text-lg">
          View Main Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🚚 Manage Trucks</h1>

          <Link href="/admin/trucks/new" className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg">
            + Add New Truck
          </Link>
        </div>

        {trucks.length === 0 ? (
          <p className="text-xl text-gray-500">No trucks found.</p>
        ) : (
          <div className="space-y-4">
            {trucks.map((truck) => (
              <div key={truck.id} className="border rounded-xl p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{truck.truck_name}</h2>
                  <p className="text-gray-600">Plate: {truck.plate_number}</p>
                  <p className="text-gray-600">VIN: {truck.vin}</p>
                </div>

                <div className="flex gap-3">
                  <Link href={`/admin/trucks/${truck.id}/edit`} className="bg-black text-white px-6 py-3 rounded-xl">
                    Edit
                  </Link>

                  <button onClick={() => deleteTruck(truck.id, truck.truck_name)} className="bg-red-600 text-white px-6 py-3 rounded-xl">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}