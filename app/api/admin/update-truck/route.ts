import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { password, id, truck } = await req.json();

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("trucks")
      .update({
        truck_number: Number(truck.truck_number),
        truck_name: truck.truck_name,
        plate_number: truck.plate_number,
        vin: truck.vin,
        insurance_number: truck.insurance_number,
        insurance_expiration: truck.insurance_expiration || null,
        registration_expiration: truck.registration_expiration || null,
        inspection_expiration: truck.inspection_expiration || null,
        notes: truck.notes,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}