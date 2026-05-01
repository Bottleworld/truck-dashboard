"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("admin");
    router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">🛠 Admin Panel</h1>

        <button
          onClick={logout}
          className="bg-red-600 text-white px-6 py-3 rounded-xl mb-8"
        >
          Logout
        </button>

        <div className="space-y-4">
          <Link
            href="/admin/trucks"
            className="block bg-blue-600 text-white p-5 rounded-xl text-xl font-bold"
          >
            🚚 Manage Trucks
          </Link>

          <Link
            href="/admin/analytics"
            className="block bg-purple-600 text-white p-5 rounded-xl text-xl font-bold"
          >
            📊 Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}