"use client";

import { useEffect } from "react";

/** First-party, cookie-based anonymous device activity. No IP or fingerprinting. */
export default function DevicePresenceTracker() {
  useEffect(() => {
    let stopped = false;

    async function heartbeat() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        await fetch("/api/device-ping", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch {
        // Analytics must never disrupt login, checkout or dashboard.
      }
    }

    void heartbeat();
    const interval = window.setInterval(() => void heartbeat(), 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") void heartbeat(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
