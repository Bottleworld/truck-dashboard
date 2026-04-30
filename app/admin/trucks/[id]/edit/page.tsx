"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EditTruckPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [truck, setTruck] = useState<any>(null);

  useEffect(() => {
    loadTruck();
  }, []);

  async function loadTruck() {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Error loading truck");
      return;
    }

    setTruck(data);
  }

  function updateField(field: string, value: string) {
    setTruck({ ...truck, [field]: value });
  }

  async function saveTruck() {
    const password = prompt("Enter admin password:");
    if (!password) return;

    const res = await fetch("/api/admin/update-truck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, id, truck }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Error saving truck");
      return;
    }

    alert("Truck updated successfully!");
    router.push("/admin/trucks");
  }

  if (!truck) return <div className="p-10 text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <Link href="/admin/trucks" className="text-blue-600 text-lg">
        ← Back to Trucks
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto mt-6">
        <h1 className="text-4xl font-bold mb-8">Edit {truck.truck_name}</h1>

        <div className="space-y-5">
          <input type="number" value={truck.truck_number || ""} onChange={(e) => updateField("truck_number", e.target.value)} placeholder="Truck Number" className="w-full border p-4 rounded-xl text-xl" />
          <input type="text" value={truck.truck_name || ""} onChange={(e) => updateField("truck_name", e.target.value)} placeholder="Truck Name" className="w-full border p-4 rounded-xl text-xl" />
          <input type="text" value={truck.plate_number || ""} onChange={(e) => updateField("plate_number", e.target.value)} placeholder="Plate Number" className="w-full border p-4 rounded-xl text-xl" />
          <input type="text" value={truck.vin || ""} onChange={(e) => updateField("vin", e.target.value)} placeholder="VIN" className="w-full border p-4 rounded-xl text-xl" />
          <input type="text" value={truck.insurance_number || ""} onChange={(e) => updateField("insurance_number", e.target.value)} placeholder="Insurance Number" className="w-full border p-4 rounded-xl text-xl" />

          <label className="block text-lg font-medium">Insurance Expiration</label>
          <input type="date" value={truck.insurance_expiration || ""} onChange={(e) => updateField("insurance_expiration", e.target.value)} className="w-full border p-4 rounded-xl text-xl" />

          <label className="block text-lg font-medium">Registration Expiration</label>
          <input type="date" value={truck.registration_expiration || ""} onChange={(e) => updateField("registration_expiration", e.target.value)} className="w-full border p-4 rounded-xl text-xl" />

          <label className="block text-lg font-medium">Inspection Expiration</label>
          <input type="date" value={truck.inspection_expiration || ""} onChange={(e) => updateField("inspection_expiration", e.target.value)} className="w-full border p-4 rounded-xl text-xl" />

          <textarea value={truck.notes || ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Notes" className="w-full border p-4 rounded-xl text-xl h-32" />

          <button onClick={saveTruck} className="w-full bg-black text-white p-5 rounded-xl text-xl">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}