import { NextRequest, NextResponse } from "next/server";

/**
 * Read-only same-origin gateway to the four tables the dashboard reads.
 * The subscription proxy checks /api/data before this handler runs.
 * Never forward browser-supplied authorization or API keys to Supabase.
 */
const TABLES = new Set(["trucks", "truck_sessions", "bag_counts", "customers"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> },
) {
  const { table } = await context.params;
  if (!TABLES.has(table)) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const url = new URL(`/rest/v1/${table}`, supabaseUrl);
    url.search = request.nextUrl.search;

    // The REST client uses different Accept headers for .single() queries.
    const accept = request.headers.get("accept");
    const acceptedTypes = new Set([
      "application/json",
      "application/vnd.pgrst.object+json",
      "application/vnd.pgrst.array+json",
    ]);

    const upstream = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: accept && acceptedTypes.has(accept) ? accept : "application/json",
      },
    });

    const body = await upstream.text();
    const response = new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "private, no-store",
      },
    });
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) response.headers.set("content-range", contentRange);
    return response;
  } catch {
    return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 502 });
  }
}
