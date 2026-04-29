"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function NewTruckPage() {
  const router = useRouter();

  const [truck, setTruck] = useState({
    truck_number: "",
    truck_name: "",
    plate_number: "",
    vin: "",
    insurance_number: "",
    insurance_expiration: "",
    registration_expiration: "",
    inspection_expiration: "",
    notes: "",
  });

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) router.push("/admin");
  }, []);

  function updateField(field: string, value: string) {
    setTruck({ ...truck, [field]: value });
  }

  async function saveTruck() {
    if (!truck.truck_number || !truck.truck_name) {
      alert("Truck Number and Truck Name are required!");
      return;
    }

    const { error } = await supabase.from("trucks").insert([
      {
        truck_number: Number(truck.truck_number),
        truck_name: truck.truck_name,
        plate_number: truck.plate_number,
        vin: truck.vin,
        insurance_number: truck.insurance_number,
        insurance_expiration: truck.insurance_expiration || null,
        registration_expiration: truck.registration_expiration || null,
        inspection_expiration: truck.inspection_expiration || null,
        notes: truck.notes,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error adding truck");
      return;
    }

    alert("Truck added successfully!");
    router.push("/admin/trucks");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <Link href="/admin/trucks" className="text-blue-600 text-lg">
        ← Back to Trucks
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto mt-6">
        <h1 className="text-4xl font-bold mb-8">Add New Truck</h1>

        <div className="space-y-5">
          <input
            type="number"
            value={truck.truck_number}
            onChange={(e) => updateField("truck_number", e.target.value)}
            placeholder="Truck Number"
            className="w-full border p-4 rounded-xl text-xl"
          />

          <input
            type="text"
            value={truck.truck_name}
            onChange={(e) => updateField("truck_name", e.target.value)}
            placeholder="Truck Name"
            className="w-full border p-4 rounded-xl text-xl"
          />

          <input
            type="text"
            value={truck.plate_number}
            onChange={(e) => updateField("plate_number", e.target.value)}
            placeholder="Plate Number"
            className="w-full border p-4 rounded-xl text-xl"
          />

          <input
            type="text"
            value={truck.vin}
            onChange={(e) => updateField("vin", e.target.value)}
            placeholder="VIN"
            className="w-full border p-4 rounded-xl text-xl"
          />

          <input
            type="text"
            value={truck.insurance_number}
            onChange={(e) => updateField("insurance_number", e.target.value)}
            placeholder="Insurance Number"
            className="w-full border p-4 rounded-xl text-xl"
          />

          <label className="block text-lg font-medium">
            Insurance Expiration
          </label>
          <input
            type="date"
            value={truck.insurance_expiration}
            onChange={(e) =>
              updateField("insurance_expiration", e.target.value)
            }
            className="w-full border p-4 rounded-xl text-xl"
          />

          <label className="block text-lg font-medium">
            Registration Expiration
          </label>
          <input
            type="date"
            value={truck.registration_expiration}
            onChange={(e) =>
              updateField("registration_expiration", e.target.value)
            }
            className="w-full border p-4 rounded-xl text-xl"
          />

          <label className="block text-lg font-medium">
            Inspection Expiration
          </label>
          <input
            type="date"
            value={truck.inspection_expiration}
            onChange={(e) =>
              updateField("inspection_expiration", e.target.value)
            }
            className="w-full border p-4 rounded-xl text-xl"
          />

          <textarea
            value={truck.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Notes"
            className="w-full border p-4 rounded-xl text-xl h-32"
          />

          <button
            onClick={saveTruck}
            className="w-full bg-black text-white p-5 rounded-xl text-xl"
          >
            Add Truck
          </button>
        </div>
      </div>
    </div>
  );
}