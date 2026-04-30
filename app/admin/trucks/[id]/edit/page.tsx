"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TruckInfoPage() {
  const params = useParams();
  const id = Number(params.id);

  const [truck, setTruck] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTruck();
  }, []);

  async function loadTruck() {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .eq("truck_number", id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTruck(data);
    setLoading(false);
  }

  function getColor(dateStr: string) {
    if (!dateStr) return "text-gray-500";

    const today = new Date();
    const date = new Date(dateStr);

    const diff = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff <= 7) return "text-red-600 font-bold";
    if (diff <= 30) return "text-yellow-600 font-bold";
    return "text-green-600 font-bold";
  }

  if (loading) {
    return <div className="p-10 text-xl">Loading...</div>;
  }

  if (!truck) {
    return (
      <div className="p-10">
        <Link href="/" className="text-blue-600 text-lg">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mt-6">Truck info not found</h1>
        <p className="text-gray-600 mt-2">
          Admin paneldan Truck #{id} information qo‘shing.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <Link href="/" className="text-blue-600 text-lg">
        ← Back
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto mt-6">
        <h1 className="text-4xl font-bold mb-6">🚚 {truck.truck_name}</h1>

        <div className="space-y-4 text-xl">
          <p>
            <b>Truck Number:</b> {truck.truck_number}
          </p>

          <p>
            <b>Plate:</b> {truck.plate_number || "Not added"}
          </p>

          <p>
            <b>VIN:</b> {truck.vin || "Not added"}
          </p>

          <p>
            <b>Insurance:</b> {truck.insurance_number || "Not added"}
          </p>

          <p className={getColor(truck.insurance_expiration)}>
            <b>Insurance Exp:</b>{" "}
            {truck.insurance_expiration || "Not added"}
          </p>

          <p className={getColor(truck.registration_expiration)}>
            <b>Registration Exp:</b>{" "}
            {truck.registration_expiration || "Not added"}
          </p>

          <p className={getColor(truck.inspection_expiration)}>
            <b>Inspection Exp:</b>{" "}
            {truck.inspection_expiration || "Not added"}
          </p>

          <p>
            <b>Notes:</b> {truck.notes || "No notes"}
          </p>
        </div>
      </div>
    </div>
  );
}