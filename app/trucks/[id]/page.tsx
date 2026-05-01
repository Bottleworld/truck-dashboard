"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function TruckPage() {
  const params = useParams();
  const id = params.id as string;

  const today = new Date().toLocaleDateString();

  const [arrivalTime, setArrivalTime] = useState("");
  const [managerName, setManagerName] = useState("");
  const [bags, setBags] = useState<number[]>([0]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const bagRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateBag(index: number, value: string) {
    const newBags = [...bags];
    newBags[index] = Number(value);
    setBags(newBags);
  }

  function addBagAndFocus() {
    setBags((prev) => {
      const next = [...prev, 0];

      setTimeout(() => {
        bagRefs.current[next.length - 1]?.focus();
      }, 80);

      return next;
    });
  }

  function nextBag(index: number) {
    if (index === bags.length - 1) {
      addBagAndFocus();
    } else {
      bagRefs.current[index + 1]?.focus();
    }
  }

  function removeBag(index: number) {
    if (bags.length === 1) return;
    setBags(bags.filter((_, i) => i !== index));

    setTimeout(() => {
      bagRefs.current[Math.max(0, index - 1)]?.focus();
    }, 80);
  }

  const totalBags = bags.filter((bag) => bag > 0).length;
  const totalBottles = bags.reduce((sum, bag) => sum + Number(bag || 0), 0);

  async function saveReport() {
    if (saving || saved) return;

    if (!arrivalTime || !managerName) {
      alert("Please fill Arrival Time and Manager Name!");
      return;
    }

    const validBags = bags.filter((bag) => bag > 0);

    if (validBags.length === 0) {
      alert("Please enter at least one bag count!");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/save-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truckId: id,
          arrivalTime,
          managerName,
          bags,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Error saving report");
        setSaving(false);
        return;
      }

      setSaved(true);
      alert("Report saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
        <Link href="/" className="text-blue-600 text-base sm:text-lg">
          ← Back
        </Link>

        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-start mt-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Truck #{id}</h1>
            <p className="text-gray-500 mt-2 text-base sm:text-lg">
              Bottle Receiving Report
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-gray-500">Date</p>
            <p className="text-2xl sm:text-3xl font-bold">{today}</p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-xl text-lg sm:text-xl font-bold">
            ✅ Report saved successfully
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block mb-2 text-lg font-semibold">
              Arrival Time
            </label>
            <input
              type="time"
              value={arrivalTime}
              disabled={saved}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full border p-4 rounded-xl text-xl"
            />
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold">
              Manager Name
            </label>
            <input
              type="text"
              value={managerName}
              disabled={saved}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Manager Name"
              className="w-full border p-4 rounded-xl text-xl"
            />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Bag Counts</h2>

        <div className="space-y-4 mb-8">
          {bags.map((bag, index) => (
            <div
              key={index}
              className="grid grid-cols-[70px_1fr] sm:grid-cols-[100px_1fr_auto_auto] gap-3 sm:gap-4 items-center"
            >
              <label className="text-xl sm:text-2xl">
                Bag #{index + 1}
              </label>

              <input
                ref={(el) => {
                  bagRefs.current[index] = el;
                }}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="next"
                value={bag || ""}
                disabled={saved}
                onChange={(e) => updateBag(index, e.target.value)}
                className="min-w-0 border p-4 rounded-xl text-2xl sm:text-3xl"
              />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => nextBag(index)}
                disabled={saved}
                className="col-start-2 sm:col-start-auto bg-blue-600 text-white px-5 py-4 rounded-xl text-lg sm:text-xl disabled:bg-gray-400"
              >
                Next
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => removeBag(index)}
                disabled={saved}
                className="col-start-2 sm:col-start-auto bg-red-600 text-white px-5 py-4 rounded-xl text-lg sm:text-xl disabled:bg-gray-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={addBagAndFocus}
            disabled={saved}
            className="w-full sm:w-auto bg-green-600 text-white px-6 py-4 rounded-xl text-xl disabled:bg-gray-400"
          >
            + Add Bag
          </button>

          <button
            type="button"
            onClick={saveReport}
            disabled={saved || saving}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-4 rounded-xl text-xl disabled:bg-gray-400"
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Report"}
          </button>

          <button
            type="button"
            onClick={printInvoice}
            className="w-full sm:w-auto bg-black text-white px-6 py-4 rounded-xl text-xl"
          >
            Print Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t pt-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600">Total Bags</p>
            <p className="text-4xl font-bold">{totalBags}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600">Total Bottles</p>
            <p className="text-4xl font-bold">{totalBottles}</p>
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