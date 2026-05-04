import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("workers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workers: data || [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { password, name } = await req.json();

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Worker name required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("workers").insert([
      {
        name: name.trim(),
        active: true,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { password, id, active } = await req.json();

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing worker id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("workers")
      .update({ active: !!active })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}