"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type BagItem = {
  type: "bottle" | "glass" | "garbich" | "straight" | "case";
  count: string;
};

export default function TruckPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const today = new Date().toLocaleDateString();

  const [managerName, setManagerName] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [notes, setNotes] = useState("");
  const [lastSelectedType, setLastSelectedType] =
    useState<BagItem["type"]>("bottle");
  const [bags, setBags] = useState<BagItem[]>([
    { type: "bottle", count: "" },
  ]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const bagRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem("managerLoggedIn");
    const name = localStorage.getItem("managerName");

    if (!loggedIn || !name) {
      router.push("/");
      return;
    }

    setManagerName(name);
  }, [router]);

  function updateBagType(index: number, type: BagItem["type"]) {
    setLastSelectedType(type);

    setBags((prev) => {
      const next: BagItem[] = [...prev];
      next[index] = { ...next[index], type };
      return next;
    });

    setTimeout(() => {
      bagRefs.current[index]?.focus();
    }, 50);
  }

  function updateBagCount(index: number, value: string) {
    setBags((prev) => {
      const next: BagItem[] = [...prev];
      next[index] = { ...next[index], count: value };
      return next;
    });
  }

  function addBagAndFocus() {
    setBags((prev) => {
      const next: BagItem[] = [
        ...prev,
        { type: lastSelectedType, count: "" },
      ];

      setTimeout(() => {
        bagRefs.current[next.length - 1]?.focus();
      }, 80);

      return next;
    });
  }

  function nextBag(index: number) {
    if (navigator.vibrate) navigator.vibrate(35);

    if (!bags[index].count || Number(bags[index].count) <= 0) {
      alert("Please enter count first.");
      return;
    }

    if (index === bags.length - 1) {
      addBagAndFocus();
    } else {
      bagRefs.current[index + 1]?.focus();
    }
  }

  function removeBag(index: number) {
    if (bags.length === 1) return;

    setBags((prev) => prev.filter((_, i) => i !== index));

    setTimeout(() => {
      bagRefs.current[Math.max(0, index - 1)]?.focus();
    }, 80);
  }

  const validBags = bags.filter((bag) => Number(bag.count) > 0);

  const totalRows = validBags.length;

  const totalBottles = validBags
    .filter((bag) => bag.type === "bottle")
    .reduce((sum, bag) => sum + Number(bag.count || 0), 0);

  const totalGlass = validBags
    .filter((bag) => bag.type === "glass")
    .reduce((sum, bag) => sum + Number(bag.count || 0), 0);

  const totalGarbich = validBags
    .filter((bag) => bag.type === "garbich")
    .reduce((sum, bag) => sum + Number(bag.count || 0), 0);

  const totalStraight = validBags
    .filter((bag) => bag.type === "straight")
    .reduce((sum, bag) => sum + Number(bag.count || 0), 0);

  const totalCase = validBags
    .filter((bag) => bag.type === "case")
    .reduce((sum, bag) => sum + Number(bag.count || 0), 0);

  async function saveReport() {
    if (saving || saved) return;

    if (!arrivalTime || !managerName) {
      alert("Please fill Arrival Time. Manager name is required from login.");
      return;
    }

    if (validBags.length === 0) {
      alert("Please enter at least one valid item!");
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
          notes,
          isCustomTruck: false,
          customerName: null,
        }),
      });

      const text = await res.text();

      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        console.error("API did not return JSON:", text);
        alert("API error. Check VS Code terminal.");
        setSaving(false);
        return;
      }

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
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
        <Link href="/dashboard" className="text-blue-600 text-base sm:text-lg">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-start mt-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Truck #{id}
            </h1>

            <p className="text-gray-500 mt-2 text-base sm:text-lg">
              Receiving Report
            </p>

            <p className="text-blue-700 mt-2 text-lg font-bold">
              Manager: {managerName || "Loading..."}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-gray-500 text-base sm:text-lg">Date</p>
            <p className="text-2xl sm:text-3xl font-bold">{today}</p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 bg-green-100 text-green-700 p-4 rounded-xl text-lg sm:text-xl font-bold">
            ✅ Report saved successfully
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 mb-10">
          <div className="min-w-0">
            <label className="block mb-2 text-lg font-semibold">
              Arrival Time
            </label>

            <input
              type="time"
              value={arrivalTime}
              disabled={saved}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full min-w-0 border p-4 rounded-xl text-xl sm:text-2xl"
            />
          </div>

          <div className="min-w-0">
            <label className="block mb-2 text-lg font-semibold">
              Add Note
            </label>

            <textarea
              value={notes}
              disabled={saved}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write note here..."
              rows={4}
              className="w-full min-w-0 border p-4 rounded-xl text-lg resize-none"
            />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-5">Counts</h2>

        <div className="space-y-4 mb-8">
          {bags.map((bag, index) => (
            <div
              key={index}
              className="grid grid-cols-[70px_145px_1fr] md:grid-cols-[120px_190px_1fr_auto_auto] gap-3 sm:gap-4 items-center"
            >
              <label className="text-xl sm:text-2xl leading-tight">
                #{index + 1}
              </label>

              <select
                value={bag.type}
                disabled={saved}
                onChange={(e) =>
                  updateBagType(index, e.target.value as BagItem["type"])
                }
                className="border p-4 rounded-xl text-lg sm:text-xl bg-white font-bold"
              >
                <option value="bottle">Bottle ♻️</option>
                <option value="glass">Glass 🍾</option>
                <option value="garbich">GARBAGE 🗑️</option>
                <option value="straight">STRAIGHT ✅</option>
                <option value="case">Case 📦</option>
              </select>

              <input
                ref={(el) => {
                  bagRefs.current[index] = el;
                }}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="next"
                value={bag.count}
                disabled={saved}
                onChange={(e) => updateBagCount(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    nextBag(index);
                  }
                }}
                placeholder="Count"
                className="min-w-0 border p-4 rounded-xl text-2xl sm:text-3xl"
              />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => nextBag(index)}
                disabled={saved}
                className="col-start-3 md:col-start-auto bg-blue-600 text-white px-5 py-4 rounded-xl text-lg sm:text-xl disabled:bg-gray-400"
              >
                Next
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => removeBag(index)}
                disabled={saved}
                className="col-start-3 md:col-start-auto bg-red-600 text-white px-5 py-4 rounded-xl text-lg sm:text-xl disabled:bg-gray-400"
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
            + Add Row
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

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 sm:gap-6 border-t pt-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-600">Total Rows</p>
            <p className="text-4xl font-bold">{totalRows}</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl">
            <p className="text-blue-700">Total Bottles</p>
            <p className="text-4xl font-bold">{totalBottles}</p>
          </div>

          <div className="bg-amber-50 p-6 rounded-xl">
            <p className="text-amber-700">Total Glass</p>
            <p className="text-4xl font-bold">{totalGlass}</p>
          </div>

          <div className="bg-red-50 p-6 rounded-xl">
            <p className="text-red-700">Total GARBAGE</p>
            <p className="text-4xl font-bold">{totalGarbich}</p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <p className="text-green-700">Total STRAIGHT</p>
            <p className="text-4xl font-bold">{totalStraight}</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl">
            <p className="text-purple-700">Total Case</p>
            <p className="text-4xl font-bold">{totalCase}</p>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <p className="text-gray-600">Manager Signature:</p>
          <div className="h-16 border-b mt-4 font-bold text-2xl flex items-end pb-2">
            {managerName}
          </div>
        </div>
      </div>
    </div>
  );
}