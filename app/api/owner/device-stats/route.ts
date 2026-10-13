import { NextRequest, NextResponse } from "next/server";
import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isOwnerCookieValid(request.cookies.get(OWNER_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Owner access required" }, {
      status: 403, headers: { "Cache-Control": "no-store" },
    });
  }

  const now = Date.now();
  const fiveMinutes = new Date(now - 5 * 60_000).toISOString();
  const day = new Date(now - 24 * 60 * 60_000).toISOString();
  const week = new Date(now - 7 * 24 * 60 * 60_000).toISOString();

  async function count(since?: string, column?: string, value?: string) {
    let query = supabaseAdmin.from("site_device_presence").select("device_id", {
      count: "exact", head: true,
    });
    if (since) query = query.gte("last_seen", since);
    if (column && value) query = query.eq(column, value);
    const { count: total, error } = await query;
    if (error) throw error;
    return total ?? 0;
  }

  try {
    const [active, last24h, last7d, all, desktop, mobile, tablet, managers, owner] = await Promise.all([
      count(fiveMinutes), count(day), count(week), count(),
      count(day, "device_type", "desktop"),
      count(day, "device_type", "mobile"),
      count(day, "device_type", "tablet"),
      count(fiveMinutes, "access_type", "manager"),
      count(fiveMinutes, "access_type", "owner"),
    ]);
    return NextResponse.json({
      active, last24h, last7d, all, desktop, mobile, tablet, managers, owner,
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Statistics temporarily unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
