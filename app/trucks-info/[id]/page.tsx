"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TruckInfoPage() {
  const params = useParams();
  const id = params.id as string;

  const [truck, setTruck] = useState<any>(null);

  useEffect(() => {
    loadTruck();
  }, []);

  async function loadTruck() {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .eq("truck_number", id)
      .single();

    if (error) {
      console.error(error);
      alert("Error loading truck info");
      return;
    }

    setTruck(data);
  }

  if (!truck) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="p-10">
      <Link href="/" className="text-blue-600 text-lg">
        ← Back
      </Link>

      <h1 className="text-4xl font-bold mt-4 mb-6">
        🚚 {truck.truck_name}
      </h1>

      <div className="space-y-4 text-xl">
        <p><b>Plate:</b> {truck.plate_number}</p>
        <p><b>VIN:</b> {truck.vin}</p>
        <p><b>Insurance:</b> {truck.insurance_number}</p>
        <p><b>Insurance Exp:</b> {truck.insurance_expiration}</p>
        <p><b>Registration Exp:</b> {truck.registration_expiration}</p>
        <p><b>Inspection Exp:</b> {truck.inspection_expiration}</p>
        <p><b>Notes:</b> {truck.notes}</p>
      </div>
    </div>
  );
}