"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const managers = [
  { name: "VANESSA", password: "Vanessa2026" },
  { name: "DOSTON", password: "Doston1994" },
  { name: "BOBIR", password: "Bobir1993" },
];

export default function LoginPage() {
  const router = useRouter();

  const [selectedManager, setSelectedManager] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("managerLoggedIn");

    if (loggedIn) {
      router.push("/dashboard");
    }
  }, [router]);

  function login() {
    const manager = managers.find(
      (m) => m.name === selectedManager && m.password === password
    );

    if (!manager) {
      alert("Wrong manager or password");
      return;
    }

    localStorage.setItem("managerLoggedIn", "true");
    localStorage.setItem("managerName", manager.name);

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border">
        <h1 className="text-4xl font-black text-center mb-2">
          Bottle World
        </h1>

        <p className="text-gray-500 text-center mb-8">Manager Login</p>

        <label className="block mb-2 font-semibold text-lg">
          Choose the Manager
        </label>

        <select
          name="username"
          autoComplete="username"
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="w-full border p-4 rounded-xl text-xl mb-5 bg-white"
        >
          <option value="">Select manager</option>
          {managers.map((manager) => (
            <option key={manager.name} value={manager.name}>
              {manager.name}
            </option>
          ))}
        </select>

        <label className="block mb-2 font-semibold text-lg">Password</label>

        <input
          name="password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Use saved password / Face ID"
          className="w-full border p-4 rounded-xl text-xl mb-6"
          onKeyDown={(e) => {
            if (e.key === "Enter") login();
          }}
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl text-xl font-bold"
        >
          Login
        </button>
      </div>
    </div>
  );
}