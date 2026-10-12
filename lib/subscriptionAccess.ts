import { createClient } from "@supabase/supabase-js";

export type SubscriptionAccess = {
  active: boolean;
  hadSubscription: boolean;
  available: boolean;
};

/**
 * Isolated Stripe sandbox state for the subscription preview.
 * A database failure must never grant pre-launch access.
 */
export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { active: false, hadSubscription: false, available: false };

  const sandbox = process.env.VERCEL_ENV !== "production" && process.env.STRIPE_SANDBOX_MODE === "true";
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from(sandbox ? "app_access_sandbox" : "app_access")
      .select("status,stripe_subscription_id,current_period_end")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return { active: false, hadSubscription: false, available: false };
    const end = Date.parse(data.current_period_end ?? "");
    const hadSubscription = Boolean(data.stripe_subscription_id);
    return {
      active: data.status === "active" && hadSubscription && Number.isFinite(end) && end > Date.now(),
      hadSubscription,
      available: true,
    };
  } catch {
    return { active: false, hadSubscription: false, available: false };
  }
}

export async function isSubscriptionActive(): Promise<boolean> {
  return (await getSubscriptionAccess()).active;
}
