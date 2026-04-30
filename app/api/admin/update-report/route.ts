import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { sessionId, password, bags } = await req.json();

    if (!sessionId || !password || !Array.isArray(bags)) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const totalBags = bags.filter((bag) => Number(bag.bottle_count) > 0).length;
    const totalBottles = bags.reduce(
      (sum, bag) => sum + Number(bag.bottle_count || 0),
      0
    );

    for (const bag of bags) {
      const { error } = await supabaseAdmin
        .from("bag_counts")
        .update({
          bottle_count: Number(bag.bottle_count),
        })
        .eq("id", bag.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { error: sessionError } = await supabaseAdmin
      .from("truck_sessions")
      .update({
        total_bags: totalBags,
        total_bottles: totalBottles,
      })
      .eq("id", sessionId);

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}