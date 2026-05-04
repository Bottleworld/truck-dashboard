import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_WORKERS = ["Estefani", "Nelly", "Gladis", "Jeny", "Anna", "Miriam"];

function getNYDateInfo() {
  const now = new Date();

  const nyString = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
  });

  const nyDateObj = new Date(nyString);

  const year = nyDateObj.getFullYear();
  const month = String(nyDateObj.getMonth() + 1).padStart(2, "0");
  const day = String(nyDateObj.getDate()).padStart(2, "0");

  const nyDate = `${year}-${month}-${day}`;

  const dayName = nyDateObj.toLocaleDateString("en-US", {
    weekday: "long",
  });

  return { nyDate, dayName };
}

function getCorrectPasscode() {
  return process.env.STAFF_EDIT_PASSCODE || "0909";
}

async function ensureWorkers() {
  const { data: existingWorkers, error: existingError } = await supabaseAdmin
    .from("workers")
    .select("*");

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existingWorkers || existingWorkers.length === 0) {
    const { error: insertError } = await supabaseAdmin.from("workers").insert(
      DEFAULT_WORKERS.map((name) => ({
        name,
        active: true,
      }))
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { data: activeWorkers, error: activeError } = await supabaseAdmin
    .from("workers")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (activeError) {
    throw new Error(activeError.message);
  }

  return activeWorkers || [];
}

export async function GET() {
  try {
    const { nyDate, dayName } = getNYDateInfo();

    const workers = await ensureWorkers();

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("worker_bag_entries")
      .select("*")
      .eq("work_date", nyDate)
      .order("created_at", { ascending: true });

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      date: nyDate,
      dayName,
      workers,
      entries: entries || [],
    });
  } catch (error: any) {
    console.error("WORKERS SCHEDULE GET ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { passcode, workerId, bagCount, managerName } = await req.json();

    const correctPasscode = getCorrectPasscode();

    if (passcode !== correctPasscode) {
      return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
    }

    if (!workerId || !bagCount || Number(bagCount) <= 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const { nyDate, dayName } = getNYDateInfo();

    const { error } = await supabaseAdmin.from("worker_bag_entries").insert([
      {
        worker_id: workerId,
        work_date: nyDate,
        day_name: dayName,
        bag_count: Number(bagCount),
        edited_by: managerName || null,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("WORKERS SCHEDULE POST ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}