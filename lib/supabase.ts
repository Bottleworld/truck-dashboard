import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Keep existing .from(...).select(...) calls intact, while reading dashboard
 * data from a same-origin server endpoint that verifies the subscription.
 * All non-database requests keep their default Supabase behavior.
 */
const subscriptionProtectedFetch: typeof fetch = async (input, init) => {
  const target = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const url = new URL(target);
  const service = new URL(supabaseUrl);

  if (url.origin !== service.origin || !url.pathname.startsWith("/rest/v1/")) {
    return fetch(input, init);
  }

  // The dashboard uses the Supabase browser client only for read operations.
  if ((init?.method ?? "GET").toUpperCase() !== "GET") {
    return new Response(JSON.stringify({ message: "Write operation not available" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const table = url.pathname.split("/")[3];
  const path = `/api/data/${encodeURIComponent(table)}${url.search}`;
  const headers = new Headers(init?.headers);
  return fetch(path, {
    method: "GET",
    headers: { Accept: headers.get("accept") ?? "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  });
};

export const supabase = createClient(supabaseUrl, anonKey, {
  global: { fetch: subscriptionProtectedFetch },
});
