import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MANAGER_COOKIE, verifyManagerSession } from "@/lib/managerAuth";
import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const DEVICE_COOKIE = "bw_anonymous_device";
const DEVICE_COOKIE_LIFETIME = 60 * 60 * 24 * 365;

function signature(id: string): string | null {
  const secret = process.env.MANAGER_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update("device:" + id).digest("base64url");
}

function readDeviceCookie(value: string | undefined): string | null {
  if (!value || value.length > 256) return null;
  const [id, mac, extra] = value.split(".");
  if (extra || !id || !mac || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id)) return null;
  const expected = signature(id);
  if (!expected) return null;
  const first = Buffer.from(expected, "base64url");
  const second = Buffer.from(mac, "base64url");
  return first.length === second.length && timingSafeEqual(first, second) ? id : null;
}

export async function POST(request: NextRequest) {
  // Record first-party page visits only. No IP addresses or raw user agents are saved.
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deviceTypeHeader = request.headers.get("user-agent") ?? "";
  const deviceType = /ipad|tablet/i.test(deviceTypeHeader)
    ? "tablet"
    : /mobile|iphone|android/i.test(deviceTypeHeader)
      ? "mobile" : "desktop";

  const owner = isOwnerCookieValid(request.cookies.get(OWNER_COOKIE_NAME)?.value);
  const manager = verifyManagerSession(request.cookies.get(MANAGER_COOKIE)?.value);
  const accessType = owner ? "owner" : manager ? "manager" : "visitor";
  const existing = readDeviceCookie(request.cookies.get(DEVICE_COOKIE)?.value);
  const deviceId = existing ?? randomUUID();
  const mac = signature(deviceId);
  if (!mac) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  try {
    const { error } = await supabaseAdmin.rpc("touch_site_device_presence", {
      p_device_id: deviceId,
      p_device_type: deviceType,
      p_access_type: accessType,
    });
    if (error) throw error;

    const response = NextResponse.json({ tracked: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
    if (!existing) {
      response.cookies.set(DEVICE_COOKIE, deviceId + "." + mac, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: DEVICE_COOKIE_LIFETIME,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Tracking unavailable" }, { status: 503 });
  }
}
