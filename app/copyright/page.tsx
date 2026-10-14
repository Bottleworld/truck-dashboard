import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Copyright & Intellectual Property Policy | Bottle World",
  description: "Bottle World copyright, intellectual property ownership, licensing and infringement inquiries.",
};

const restrictions = [
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
    <main
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-16"
      style={{ colorScheme: "light" }}
    >
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-10">
        <Link href="/" className="inline-flex rounded-lg px-1 py-2 text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-600">
          ← Back to Bottle World
        </Link>

        <header className="mt-5 border-b border-slate-200 pb-7">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">
            Legal information
          </p>
          <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
            Bottle World — Copyright &amp; Intellectual Property Policy
          </h1>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Effective Date: October 13, 2026
          </p>
        </header>

        <div className="space-y-8 pt-8 text-base leading-7 text-slate-700">
          <section aria-labelledby="copyright-notice">
            <h2 id="copyright-notice" className="mb-3 text-xl font-bold text-slate-900">
              Copyright Notice
            </h2>
            <p className="font-bold text-slate-900">© 2026 Bottle World. All Rights Reserved.</p>
            <p className="mt-3">
              Bottle World respects and protects intellectual property rights under applicable
              United States copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section aria-labelledby="ownership">
            <h2 id="ownership" className="mb-3 text-xl font-bold text-slate-900">
              1. Ownership of Intellectual Property
            </h2>
            <p>
              The original website content, software code, custom graphics, user interface
              elements, original text, and other proprietary materials are owned by Bottle World
              or its respective rights holders, to the extent protected by applicable law.
            </p>
            <p className="mt-3">
              Third-party and open-source components remain subject to their respective licenses.
            </p>
          </section>

          <section aria-labelledby="unauthorized-use">
            <h2 id="unauthorized-use" className="mb-3 text-xl font-bold text-slate-900">
              2. Restrictions on Unauthorized Use
            </h2>
            <p>
              Except as expressly authorized in writing or permitted by applicable law, users
              and third parties may not:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {restrictions.map((restriction) => (
                <li key={restriction}>{restriction}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="integrations">
            <h2 id="integrations" className="mb-3 text-xl font-bold text-slate-900">
              3. Third-Party Applications and Integrations
            </h2>
            <p>
              Any third-party application seeking to integrate with Bottle World must comply
              with applicable laws and Bottle World’s valid contractual terms.
            </p>
            <p className="mt-3">
              Integration does not grant ownership of Bottle World’s proprietary code, content,
              branding, or confidential information.
            </p>
            <p className="mt-3">
              Commercial redistribution of protected materials requires prior written authorization.
            </p>
          </section>

          <section aria-labelledby="enforcement">
            <h2 id="enforcement" className="mb-3 text-xl font-bold text-slate-900">
              4. Enforcement of Intellectual Property Rights
            </h2>
            <p>
              Bottle World reserves the right to pursue available legal remedies against
              infringement of its intellectual property rights.
            </p>
            <p className="mt-3">Depending on the circumstances, these remedies may include:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {remedies.map((remedy) => (
                <li key={remedy}>{remedy}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="no-transfer">
            <h2 id="no-transfer" className="mb-3 text-xl font-bold text-slate-900">
              5. No Transfer of Ownership
            </h2>
            <p>
              Access to Bottle World does not transfer ownership of any intellectual property
              or grant permission to reproduce protected materials beyond applicable permissions,
              licenses, or legal exceptions.
            </p>
          </section>

          <section aria-labelledby="inquiries">
            <h2 id="inquiries" className="mb-3 text-xl font-bold text-slate-900">
              6. Copyright Inquiries
            </h2>
            <p>
              For copyright permissions, licensing requests, or infringement-related inquiries,
              contact:
            </p>
            <p className="mt-3">
              <strong className="text-slate-900">Copyright Owner:</strong> Sherali Islomov
            </p>
            <p>
              <strong className="text-slate-900">Email:</strong>{" "}
              <a
                href="mailto:info@bottleworld.lol"
                className="break-all font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                info@bottleworld.lol
              </a>
            </p>
          </section>

          <section aria-labelledby="law">
            <h2 id="law" className="mb-3 text-xl font-bold text-slate-900">
              7. Applicable Law
            </h2>
            <p>
              This policy is intended to operate consistently with applicable United States
              federal law and, where relevant, New York law.
            </p>
            <p className="mt-3">
              Nothing in this policy limits rights, exceptions, or defenses provided by
              applicable law.
            </p>
          </section>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm font-semibold text-slate-600">
          Bottle World — All Rights Reserved.
        </footer>
      </article>
    </main>
  );
}
