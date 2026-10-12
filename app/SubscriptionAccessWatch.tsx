"use client";

import { useEffect } from "react";

/**
 * Keep already-open devices in sync when a subscription starts or expires.
 * This only updates the UI; proxy.ts enforces authorization server-side.
 */
export default function SubscriptionAccessWatch() {
  useEffect(() => {
    let disposed = false;

    async function verify() {
      if (disposed || document.visibilityState === "hidden") return;
      const path = window.location.pathname;
      if (path === "/billing") return;

      try {
        const response = await fetch("/api/subscription-status", { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) return;
        const result: { active?: boolean; ownerAuthorized?: boolean } = await response.json();
        if (disposed) return;
        const allowed = Boolean(result.active || result.ownerAuthorized);

        if (!allowed && path !== "/") {
          localStorage.removeItem("managerLoggedIn");
          localStorage.removeItem("managerName");
          window.location.replace("/");
        } else if (path === "/") {
          const popupShown = document.getElementById("subscription-paywall") !== null;
          if ((allowed && popupShown) || (!allowed && !popupShown)) window.location.reload();
        }
      } catch {
        // No browser-side grant is ever made on network failures.
      }
    }

    const interval = window.setInterval(() => void verify(), 15_000);
    const onVisible = () => { if (document.visibilityState === "visible") void verify(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
