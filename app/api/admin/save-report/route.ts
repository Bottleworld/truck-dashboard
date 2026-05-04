import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BagItem = {
  type: "bottle" | "glass" | "garbich" | "straight" | "case" | "";
  count: string | number;
};

export async function POST(req: Request) {
  try {
    const {
      truckId,
      arrivalTime,
      managerName,
      bags,
      customerName,
      isCustomTruck,
    } = await req.json();

    if (!truckId || !arrivalTime || !managerName || !Array.isArray(bags)) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const validBags: BagItem[] = bags.filter(
      (bag: BagItem) => bag.type && Number(bag.count) > 0
    );

    if (validBags.length === 0) {
      return NextResponse.json(
        { error: "Please enter at least one valid item" },
        { status: 400 }
      );
    }

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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    if (isCustomTruck && customerName) {
      await supabaseAdmin
        .from("customers")
        .upsert([{ name: String(customerName).trim().toUpperCase() }], {
          onConflict: "name",
        });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("truck_sessions")
      .insert([
        {
          truck_id: String(truckId),
          arrival_time: arrivalTime,
          manager_name: managerName,
          total_bags: validBags.length,
          total_bottles: totalBottles,
          total_glass: totalGlass,
          total_trash: totalGarbich,
          total_straight: totalStraight,
          total_case: totalCase,
          customer_name: customerName
            ? String(customerName).trim().toUpperCase()
            : null,
          is_custom_truck: !!isCustomTruck,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    const bagData = validBags.map((bag, index) => ({
      session_id: session.id,
      bag_number: index + 1,
      bottle_count: bag.type === "bottle" ? Number(bag.count) : 0,
      glass_count: bag.type === "glass" ? Number(bag.count) : 0,
      trash_count: bag.type === "garbich" ? Number(bag.count) : 0,
      straight_count: bag.type === "straight" ? Number(bag.count) : 0,
      case_count: bag.type === "case" ? Number(bag.count) : 0,
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