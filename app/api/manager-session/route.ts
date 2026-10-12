import { NextRequest, NextResponse } from "next/server";
import { MANAGER_COOKIE, verifyManagerSession } from "@/lib/managerAuth";

export async function GET(request: NextRequest) {
  const manager = verifyManagerSession(request.cookies.get(MANAGER_COOKIE)?.value);
  return NextResponse.json({ authenticated: Boolean(manager), manager }, {
    headers: { "Cache-Control": "no-store" },
  });
}
