import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Copyright & Intellectual Property Policy | Bottle World",
  description: "Bottle World copyright and intellectual property ownership, permissions, integrations, and enforcement policy.",
  robots: { index: true, follow: true },
};

const prohibitedUses = [
  "Reproduce, copy, distribute, or commercially exploit protected Bottle World materials.",
  "Create or distribute unauthorized copies of proprietary website code or protected content.",
  "Resell, sublicense, or redistribute protected Bottle World materials.",
  "Use Bottle World branding, logos, or proprietary materials in a manner that infringes applicable intellectual property rights.",
  "Access protected administrative systems or confidential information without authorization.",
];

const remedies = [
  "Copyright infringement notices and DMCA takedown requests.",
  "Requests to remove or disable access to infringing material.",
  "Injunctive relief where authorized by law.",
  "Civil litigation and recovery of damages or other relief available under applicable law.",
];

export default function CopyrightPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-10 text-slate-900 sm:px-6 sm:py-14" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
          <Link href="/" className="rounded-lg px-2 py-1 text-blue-700 hover:bg-blue-100 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500">Bottle World</Link>
          <span aria-hidden="true">/</span>
          <span>Copyright & Intellectual Property Policy</span>
        </nav>
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <header className="border-b border-slate-200 bg-slate-50 px-6 py-9 sm:px-12 sm:py-12">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Legal information</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">Bottle World — Copyright & Intellectual Property Policy</h1>
            <p className="mt-4 text-sm font-semibold text-slate-600">Effective Date: October 13, 2026</p>
          </header>

          <div className="space-y-9 px-6 py-9 leading-7 text-slate-700 sm:px-12 sm:py-12">
            <section aria-labelledby="copyright-notice" className="space-y-3">
              <h2 id="copyright-notice" className="text-2xl font-bold text-slate-900">Copyright Notice</h2>
              <p className="text-lg font-bold text-slate-900">© 2026 Bottle World. All Rights Reserved.</p>
              <p>Bottle World respects and protects intellectual property rights under applicable United States copyright, trademark, and other intellectual property laws.</p>
            </section>

            <section aria-labelledby="ownership" className="space-y-3">
              <h2 id="ownership" className="text-xl font-bold text-slate-900">1. Ownership of Intellectual Property</h2>
              <p>The original website content, software code, custom graphics, user interface elements, original text, and other proprietary materials are owned by Bottle World or its respective rights holders, to the extent protected by applicable law.</p>
              <p>Third-party and open-source components remain subject to their respective licenses.</p>
            </section>

            <section aria-labelledby="restrictions" className="space-y-3">
              <h2 id="restrictions" className="text-xl font-bold text-slate-900">2. Restrictions on Unauthorized Use</h2>
              <p>Except as expressly authorized in writing or permitted by applicable law, users and third parties may not:</p>
              <ul className="list-disc space-y-2 pl-6 marker:text-blue-700">
                {prohibitedUses.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section aria-labelledby="integrations" className="space-y-3">
              <h2 id="integrations" className="text-xl font-bold text-slate-900">3. Third-Party Applications and Integrations</h2>
              <p>Any third-party application seeking to integrate with Bottle World must comply with applicable laws and Bottle World’s valid contractual terms.</p>
              <p>Integration does not grant ownership of Bottle World’s proprietary code, content, branding, or confidential information.</p>
              <p>Commercial redistribution of protected materials requires prior written authorization.</p>
            </section>

            <section aria-labelledby="enforcement" className="space-y-3">
              <h2 id="enforcement" className="text-xl font-bold text-slate-900">4. Enforcement of Intellectual Property Rights</h2>
              <p>Bottle World reserves the right to pursue available legal remedies against infringement of its intellectual property rights.</p>
              <p>Depending on the circumstances, these remedies may include:</p>
              <ul className="list-disc space-y-2 pl-6 marker:text-blue-700">
                {remedies.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section aria-labelledby="no-transfer" className="space-y-3">
              <h2 id="no-transfer" className="text-xl font-bold text-slate-900">5. No Transfer of Ownership</h2>
              <p>Access to Bottle World does not transfer ownership of any intellectual property or grant permission to reproduce protected materials beyond applicable permissions, licenses, or legal exceptions.</p>
            </section>

            <section aria-labelledby="inquiries" className="space-y-3">
              <h2 id="inquiries" className="text-xl font-bold text-slate-900">6. Copyright Inquiries</h2>
              <p>For copyright permissions, licensing requests, or infringement-related inquiries, contact:</p>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-slate-900">
                <p><strong>Copyright Owner:</strong> [Legal owner or company name]</p>
                <p><strong>Email:</strong> [Official legal contact email]</p>
              </div>
            </section>

            <section aria-labelledby="law" className="space-y-3">
              <h2 id="law" className="text-xl font-bold text-slate-900">7. Applicable Law</h2>
              <p>This policy is intended to operate consistently with applicable United States federal law and, where relevant, New York law.</p>
              <p>Nothing in this policy limits rights, exceptions, or defenses provided by applicable law.</p>
            </section>

            <footer className="border-t border-slate-200 pt-7 text-center">
              <p className="font-bold text-slate-900">Bottle World — All Rights Reserved.</p>
              <Link href="/" className="mt-4 inline-block font-semibold text-blue-700 hover:underline">← Back to Bottle World</Link>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}
