"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Truck = {
  id: string;
  truck_number: number;
  truck_name: string;
  plate_number: string;
  vin: string;
  insurance_number: string;
  insurance_expiration: string;
  registration_expiration: string;
  inspection_expiration: string;
  notes: string;
};

export default function AdminTrucksPage() {
  const router = useRouter();
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) router.push("/admin");

    loadTrucks();
  }, []);

  async function loadTrucks() {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .order("truck_number", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error loading trucks");
      return;
    }

    setTrucks(data || []);
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

          <Link
            href="/admin/trucks/new"
            className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg"
          >
            + Add New Truck
          </Link>
        </div>

        {trucks.length === 0 ? (
          <p className="text-xl text-gray-500">No trucks found.</p>
        ) : (
          <div className="space-y-4">
            {trucks.map((truck) => (
              <div
                key={truck.id}
                className="border rounded-xl p-5 flex justify-between items-center"
              >
                <div>
                  <h2 className="text-2xl font-bold">{truck.truck_name}</h2>
                  <p className="text-gray-600">Plate: {truck.plate_number}</p>
                  <p className="text-gray-600">VIN: {truck.vin}</p>
                </div>

                <Link
                  href={`/admin/trucks/${truck.id}/edit`}
                  className="bg-black text-white px-6 py-3 rounded-xl"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}