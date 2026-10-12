"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentReturn() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/subscription-status", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json();
          if (result.active && !cancelled) {
            setActive(true);
            router.replace("/");
            return;
          }
        }
      } catch {
        // Stripe may still be delivering the webhook. Retry.
      }
      if (!cancelled) setAttempts((count) => count + 1);
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [router]);

  return (
    <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "10px", marginBottom: "18px" }}>
      <p style={{ fontWeight: 700 }}>
        {active ? "Subscription active! Opening dashboard..." : "Stripe is confirming your subscription."}
      </p>
      <p style={{ marginTop: "8px", color: "#334155" }}>
        {attempts >= 12
          ? "This is taking longer than expected. If payment was completed, contact support before paying again."
          : "If you completed payment, this page will open the manager login automatically when your subscription is active. Do not pay twice."}
      </p>
    </div>
  );
}
