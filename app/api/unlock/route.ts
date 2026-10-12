import { NextResponse } from "next/server";

/** Deprecated: users may not grant themselves dashboard access via a cookie. */
export async function POST() {
  return NextResponse.json({ error: "This endpoint has been disabled" }, {
    status: 410, headers: { "Cache-Control": "no-store" },
  });
}
