import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { truckId, arrivalTime, managerName, bags } = await req.json();

    if (!truckId || !arrivalTime || !managerName || !Array.isArray(bags)) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const validBags = bags.filter((bag) => Number(bag) > 0);

    if (validBags.length === 0) {
      return NextResponse.json({ error: "No valid bags" }, { status: 400 });
    }

    const totalBottles = validBags.reduce(
      (sum, count) => sum + Number(count || 0),
      0
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("truck_sessions")
      .insert([
        {
          truck_id: String(truckId),
          arrival_time: arrivalTime,
          manager_name: managerName,
          total_bags: validBags.length,
          total_bottles: totalBottles,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    const bagData = validBags.map((count, index) => ({
      session_id: session.id,
      bag_number: index + 1,
      bottle_count: Number(count),
    }));

    const { error: bagError } = await supabaseAdmin
      .from("bag_counts")
      .insert(bagData);

    if (bagError) {
      return NextResponse.json({ error: bagError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}