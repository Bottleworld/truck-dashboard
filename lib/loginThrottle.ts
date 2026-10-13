import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Server-side atomic rate limiting, shared across Vercel instances.
 * Fail closed if the database or limiter is unavailable.
 */
export async function checkLoginRateLimit(
  request: NextRequest,
  scope: "manager" | "admin" | "owner",
  maxAttempts: number = 6,
): Promise<"allowed" | "limited" | "unavailable"> {
  // Vercel supplies the trusted forwarding chain. Do not put raw IPs in the database.
  const ip = (request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim().slice(0, 128);
  const key = scope + ":" + createHash("sha256").update(ip).digest("hex");
  try {
    const { data, error } = await supabaseAdmin.rpc("consume_login_attempt", {
      p_attempt_key: key,
      p_limit: maxAttempts,
      p_window_seconds: 15 * 60,
    });
    if (error || typeof data !== "boolean") return "unavailable";
    return data ? "allowed" : "limited";
  } catch {
    return "unavailable";
  }
}
