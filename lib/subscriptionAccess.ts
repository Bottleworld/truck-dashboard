import { createClient } from "@supabase/supabase-js";

export async function isSubscriptionActive(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from("app_access")
      .select("status,stripe_subscription_id,current_period_end")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data || data.status !== "active" || !data.stripe_subscription_id) return false;
    const expiration = Date.parse(data.current_period_end ?? "");
    return Number.isFinite(expiration) && expiration > Date.now();
  } catch {
    return false;
  }
}
