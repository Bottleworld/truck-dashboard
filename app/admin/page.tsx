"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin-session", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Wrong password" : "Unable to log in. Please try again.");
        return;
      }
      setPassword("");
      localStorage.setItem("admin", "true");
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-slate-900" style={{ colorScheme: "light" }}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-9 text-center shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">🔐 Admin Login</h1>
        <form onSubmit={(event) => void handleLogin(event)}>
          <label htmlFor="admin-password" className="mb-2 block text-left font-semibold text-slate-800">Admin password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-500"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p role="alert" className="mb-3 text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-xl bg-slate-950 p-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>
        <Link href="/dashboard" className="mt-4 block rounded-xl border border-slate-300 bg-white p-3 font-semibold text-blue-700 hover:bg-blue-50">
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
