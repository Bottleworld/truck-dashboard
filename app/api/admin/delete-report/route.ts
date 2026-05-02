import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body.password;
    const id = body.id || body.sessionId || body.reportId;

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const { error: bagError } = await supabaseAdmin
      .from("bag_counts")
      .delete()
      .eq("session_id", id);

    if (bagError) {
      return NextResponse.json({ error: bagError.message }, { status: 500 });
    }

    const { error: sessionError } = await supabaseAdmin
      .from("truck_sessions")
      .delete()
      .eq("id", id);

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}