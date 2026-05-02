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

  function getDaysLeft(dateString?: string) {
    if (!dateString) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    return Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function getStatus(dateString?: string) {
    const days = getDaysLeft(dateString);

    if (days === null) {
      return {
        text: "Not added",
        className: "bg-gray-100 text-gray-600 border-gray-300",
      };
    }

    if (days < 0) {
      return {
        text: "Expired",
        className: "bg-red-100 text-red-700 border-red-300",
      };
    }

    if (days === 0) {
      return {
        text: "Expires today",
        className: "bg-red-100 text-red-700 border-red-300",
      };
    }

    if (days <= 7) {
      return {
        text: `Expiring soon (${days} days left)`,
        className: "bg-red-100 text-red-700 border-red-300",
      };
    }

    if (days <= 30) {
      return {
        text: `Expiring soon (${days} days left)`,
        className: "bg-yellow-100 text-yellow-700 border-yellow-300",
      };
    }

    return {
      text: "OK",
      className: "bg-green-100 text-green-700 border-green-300",
    };
  }

  function InfoRow({
    label,
    value,
    date,
  }: {
    label: string;
    value: string;
    date?: boolean;
  }) {
    const status = date ? getStatus(value) : null;

    return (
      <div className="border rounded-2xl p-5 flex justify-between items-center gap-4">
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-2xl font-bold">{value || "Not added"}</p>
        </div>

        {date && (
          <span
            className={`border px-4 py-2 rounded-full text-sm font-bold ${status?.className}`}
          >
            {status?.text}
          </span>
        )}
      </div>
    );
  }

  if (loading) return <div className="p-10 text-xl">Loading...</div>;

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 text-lg">
          ← Back
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 mt-6">
          <h1 className="text-5xl font-black mb-2">🚚 {truck.truck_name}</h1>
          <p className="text-gray-500 text-lg mb-8">Truck document details</p>

          <div className="space-y-4">
            <InfoRow label="Truck Number" value={String(truck.truck_number)} />
            <InfoRow label="Plate" value={truck.plate_number} />
            <InfoRow label="VIN" value={truck.vin} />
            <InfoRow label="Insurance Number" value={truck.insurance_number} />

            <InfoRow
              label="Insurance Expiration"
              value={truck.insurance_expiration}
              date
            />

            <InfoRow
              label="Registration Expiration"
              value={truck.registration_expiration}
              date
            />

            <InfoRow
              label="Inspection Expiration"
              value={truck.inspection_expiration}
              date
            />

            <InfoRow
              label="NVT Tax Expiration"
              value={truck.nvt_tax_expiration}
              date
            />

            <div className="border rounded-2xl p-5">
              <p className="text-gray-500 text-sm">Notes</p>
              <p className="text-2xl font-bold">{truck.notes || "No notes"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}