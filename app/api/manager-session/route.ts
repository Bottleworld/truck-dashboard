import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";
import { NextRequest, NextResponse } from "next/server";
import { MANAGER_COOKIE, verifyManagerSession } from "@/lib/managerAuth";

export async function GET(request: NextRequest) {
  const owner = isOwnerCookieValid(request.cookies.get(OWNER_COOKIE_NAME)?.value);
  if (owner) return NextResponse.json({ authenticated: true, manager: "OWNER" }, { headers: { "Cache-Control": "no-store" } });
  const manager = verifyManagerSession(request.cookies.get(MANAGER_COOKIE)?.value);
  return NextResponse.json({ authenticated: Boolean(manager), manager }, {
    headers: { "Cache-Control": "no-store" },
  });
}
