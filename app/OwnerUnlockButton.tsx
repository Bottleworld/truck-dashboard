"use client";

import { useRef, useState, type FormEvent } from "react";

export default function OwnerUnlockButton({ asTitle = false }: { asTitle?: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastTap = useRef(0);
  const tapCount = useRef(0);

  function onTitleTap() {
    const now = Date.now();
    // Three consecutive taps/clicks on the Bottle World heading.
    // A gap over 1.1 seconds restarts the sequence.
    tapCount.current = now - lastTap.current <= 1100 ? tapCount.current + 1 : 1;
    lastTap.current = now;
    if (tapCount.current === 3) {
      tapCount.current = 0;
      setOpen(true);
      setError("");
      setPassword("");
    }
  }


  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/site-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Access denied");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {asTitle ? (
        <h1 className="mb-2 text-center text-4xl font-black text-slate-900">
          <button type="button" aria-label="Bottle World"
            onClick={onTitleTap}
            className="cursor-default select-none touch-manipulation focus-visible:outline-2 focus-visible:outline-blue-500">
            Bottle World
          </button>
        </h1>
      ) : (
        <button type="button" onClick={() => { setOpen(true); setError(""); setPassword(""); }}
          title="Site owner access" aria-label="Site owner access"
          className="mx-auto mb-5 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-700 hover:bg-blue-200 focus-visible:outline-4 focus-visible:outline-blue-400">
          🔒
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="owner-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-slate-900 shadow-2xl"
            style={{ colorScheme: "light" }}>
            <h2 id="owner-title" className="mb-2 text-2xl font-bold text-slate-900">Owner Access</h2>
            <p className="mb-5 text-sm text-slate-600">Enter your private site-owner password to inspect the dashboard.</p>
            <form onSubmit={(event) => void unlock(event)}>
              <label htmlFor="owner-secret" className="mb-2 block font-semibold text-slate-800">Password</label>
              <input id="owner-secret" autoFocus type="password" autoComplete="off" required
                className="mb-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus:outline-blue-600"
                value={password} onChange={(event) => setPassword(event.target.value)} />
              {error && <p role="alert" className="mb-3 text-sm font-semibold text-red-700">{error}</p>}
              <button disabled={busy || !password} type="submit"
                className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {busy ? "Checking..." : "Unlock Dashboard"}
              </button>
            </form>
            <button type="button" onClick={() => { setOpen(false); setPassword(""); setError(""); }}
              className="mt-3 w-full p-2 font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
