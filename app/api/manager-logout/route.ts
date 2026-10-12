import { ADMIN_COOKIE } from "@/lib/adminSession";
import { OWNER_COOKIE_NAME } from "@/lib/siteOwner";
import { NextResponse } from "next/server";
import { MANAGER_COOKIE } from "@/lib/managerAuth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(MANAGER_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0,
  });
  response.cookies.set(OWNER_COOKIE_NAME, "", {
    httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0,
  });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
