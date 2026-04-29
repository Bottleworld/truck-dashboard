"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin");

    if (!isAdmin) {
      router.push("/admin");
    }
  }, []);

  function logout() {
    localStorage.removeItem("admin");
    router.push("/admin");
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">🛠 Admin Panel</h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

      <div className="mt-6 space-y-4">
        <a
          href="/admin/trucks"
          className="block bg-blue-600 text-white p-4 rounded"
        >
          🚚 Manage Trucks
        </a>
      </div>
    </div>
  );
}