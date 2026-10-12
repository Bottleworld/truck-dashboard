import { createClient } from "@supabase/supabase-js";

export type SubscriptionAccess = {
  active: boolean;
  hadSubscription: boolean;
  available: boolean;
  daysRemaining: number | null;
  currentPeriodEnd: string | null;
};

/** Read verified subscription status, never from browser storage or a user-supplied cookie. */
export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  const unavailable: SubscriptionAccess = {
    active: false, hadSubscription: false, available: false,
    daysRemaining: null, currentPeriodEnd: null,
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return unavailable;

  const sandbox = process.env.VERCEL_ENV !== "production" && process.env.STRIPE_SANDBOX_MODE === "true";

  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from(sandbox ? "app_access_sandbox" : "app_access")
      .select("status,stripe_subscription_id,current_period_end")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return unavailable;

    const expiration = Date.parse(data.current_period_end ?? "");
    const hadSubscription = Boolean(data.stripe_subscription_id);
    const active = data.status === "active" && hadSubscription &&
      Number.isFinite(expiration) && expiration > Date.now();

    return {
      active,
      hadSubscription,
      available: true,
      daysRemaining: active ? Math.ceil((expiration - Date.now()) / 86_400_000) : null,
      currentPeriodEnd: active ? new Date(expiration).toISOString() : null,
    };
  } catch {
    return unavailable;
  }
}

export async function isSubscriptionActive(): Promise<boolean> {
  return (await getSubscriptionAccess()).active;
}
