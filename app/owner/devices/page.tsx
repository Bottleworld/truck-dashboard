import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";
import OwnerDeviceDashboard from "./OwnerDeviceDashboard";

export const dynamic = "force-dynamic";

export default async function OwnerDevicesPage() {
  if (!isOwnerCookieValid((await cookies()).get(OWNER_COOKIE_NAME)?.value)) {
    redirect("/");
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-5 sm:p-10 text-slate-900" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="inline-flex mb-7 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50">
          ← Back to Dashboard
        </Link>
        <header className="mb-8">
          <p className="text-sm font-black tracking-wider uppercase text-blue-700">Owner only</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Website Device Activity</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Approximate devices visiting Bottle World. Counts start when this feature was enabled.
            One browser with its cookie is counted once, even after repeat visits.
          </p>
        </header>
        <OwnerDeviceDashboard />
      </div>
    </main>
  );
}
