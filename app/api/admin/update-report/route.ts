import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BagUpdate = {
  id: string;
  bottle_count?: number;
  glass_count?: number;
  trash_count?: number;
  straight_count?: number;
};

export async function POST(req: Request) {
  try {
    const { password, sessionId, bags } = await req.json();

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!sessionId || !Array.isArray(bags)) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    let totalBottles = 0;
    let totalGlass = 0;
    let totalTrash = 0;
    let totalStraight = 0;
    let totalRows = 0;

    for (const bag of bags as BagUpdate[]) {
      const bottle = Number(bag.bottle_count || 0);
      const glass = Number(bag.glass_count || 0);
      const trash = Number(bag.trash_count || 0);
      const straight = Number(bag.straight_count || 0);

      if (bottle > 0 || glass > 0 || trash > 0 || straight > 0) {
        totalRows += 1;
      }

      totalBottles += bottle;
      totalGlass += glass;
      totalTrash += trash;
      totalStraight += straight;

      const { error } = await supabaseAdmin
        .from("bag_counts")
        .update({
          bottle_count: bottle,
          glass_count: glass,
          trash_count: trash,
          straight_count: straight,
        })
        .eq("id", bag.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { error: sessionError } = await supabaseAdmin
      .from("truck_sessions")
      .update({
        total_bags: totalRows,
        total_bottles: totalBottles,
        total_glass: totalGlass,
        total_trash: totalTrash,
        total_straight: totalStraight,
      })
      .eq("id", sessionId);

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}