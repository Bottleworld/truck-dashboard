"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OwnerUnlockButton from "./OwnerUnlockButton";

const managers = ["VANESSA", "DOSTON", "BOBIR"];

export default function ManagerLogin() {
  const router = useRouter();
  const [selectedManager, setSelectedManager] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const res = await fetch("/api/manager-session", { cache: "no-store" });
        if (!res.ok) throw new Error("Session unavailable");
        const data = await res.json();
        if (cancelled) return;
        if (data.authenticated && typeof data.manager === "string") {
          localStorage.setItem("managerLoggedIn", "true");
          localStorage.setItem("managerName", data.manager);
          router.replace("/dashboard");
          return;
        }
      } catch {
        // The manager can log in normally if their prior session expired.
      }
      if (!cancelled) {
        localStorage.removeItem("managerLoggedIn");
        localStorage.removeItem("managerName");
      }
    }
    void restoreSession();
    return () => { cancelled = true; };
  }, [router]);

  async function login() {
    if (loggingIn || !selectedManager || !password) return;
    setLoggingIn(true);
    try {
      const response = await fetch("/api/manager-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager: selectedManager, password }),
      });
      if (!response.ok) {
        alert(response.status === 401 ? "Wrong manager or password" : "Unable to log in. Try again.");
        return;
      }
      localStorage.setItem("managerLoggedIn", "true");
      localStorage.setItem("managerName", selectedManager);
      router.replace("/dashboard");
    } catch {
      alert("Unable to log in. Try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-6 text-slate-900" style={{ colorScheme: "light" }}>
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-slate-200">
        <OwnerUnlockButton asTitle />
        <p className="text-slate-600 text-center mb-8">Manager Login</p>
        <label htmlFor="manager" className="block mb-2 font-semibold text-lg text-slate-800">Choose the Manager</label>
        <select
          id="manager"
          name="username"
          autoComplete="username"
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="w-full border border-slate-300 p-4 rounded-xl text-xl mb-5 bg-white text-slate-900"
        >
          <option value="">Select manager</option>
          {managers.map((manager) => <option key={manager} value={manager}>{manager}</option>)}
        </select>
        <label htmlFor="password" className="block mb-2 font-semibold text-lg text-slate-800">Password</label>
        <input
          id="password"
          name="password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Use saved password / Face ID"
          className="w-full border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 p-4 rounded-xl text-xl mb-6"
          onKeyDown={(e) => { if (e.key === "Enter") void login(); }}
        />
        <button
          onClick={() => void login()}
          disabled={loggingIn || !selectedManager || !password}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl text-xl font-bold disabled:opacity-50"
        >{loggingIn ? "Logging in..." : "Login"}</button>
        <p className="mt-5 text-center text-xs">
          <Link href="/copyright" className="font-semibold text-blue-700 underline underline-offset-2 hover:underline">
            Copyright &amp; IP Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
