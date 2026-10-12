type Props = {
  available: boolean;
  monthlyLink: string;
  yearlyLink: string;
  sandbox: boolean;
};

export default function SubscriptionPaywall({ available, monthlyLink, yearlyLink, sandbox }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100 text-slate-900" style={{ colorScheme: "light" }}>
      {/* The visible login card is a non-interactive preview. Access is gated on the server. */}
      <div aria-hidden="true" className="pointer-events-none select-none min-h-screen flex items-center justify-center p-6 blur-[3px] opacity-40">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
          <h1 className="text-center text-4xl font-black text-slate-900 mb-2">Bottle World</h1>
          <p className="text-center text-slate-600 mb-8">Manager Login</p>
          <div className="text-slate-800 font-semibold mb-2">Choose the Manager</div>
          <div className="h-14 bg-slate-100 border border-slate-300 rounded-xl mb-5" />
          <div className="text-slate-800 font-semibold mb-2">Password</div>
          <div className="h-14 bg-slate-100 border border-slate-300 rounded-xl mb-5" />
          <div className="bg-blue-600 text-white rounded-xl p-4 font-bold text-center">Login</div>
        </div>
      </div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscription-title"
          aria-describedby="subscription-description"
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-9 text-slate-900"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-3xl" aria-hidden="true">🔒</div>
          <p className="text-center text-blue-700 font-black tracking-widest text-xs uppercase mb-3">
            {available ? "Subscription required" : "Subscription verification unavailable"}
          </p>
          <h1 id="subscription-title" className="text-center text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            {available ? "Activate Bottle World" : "Please try again shortly"}
          </h1>
          <p id="subscription-description" className="text-slate-600 text-center leading-relaxed mb-7">
            {available
              ? "An active subscription is required to unlock the manager dashboard, truck records and reports. Choose a plan below to continue."
              : "We cannot verify your subscription right now. Please refresh this page; do not make another payment if you have already paid."}
          </p>
          {available ? (
            <div className="grid gap-3">
              {sandbox && <p className="text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-3 rounded-xl">Sandbox preview — no real money will be charged.</p>}
              <a href={monthlyLink} className="block rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-center p-5 font-bold focus-visible:outline-4 focus-visible:outline-blue-300">
                <span className="block text-xl">Subscribe Monthly — $89.99</span>
                <span className="block text-sm font-medium opacity-90 mt-1">Automatically renews every month until canceled</span>
              </a>
              <a href={yearlyLink} className="block rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white text-slate-900 text-center p-5 font-bold focus-visible:outline-4 focus-visible:outline-blue-300">
                <span className="block text-xl">Subscribe Yearly — $899</span>
                <span className="block text-sm font-medium text-slate-600 mt-1">Save $180.88 per year — renews yearly</span>
              </a>
            </div>
          ) : (
            <a href="/" className="block rounded-2xl bg-blue-600 text-white text-center p-4 font-bold">Try Again</a>
          )}
          <p className="text-center text-xs text-slate-500 mt-6">
            Secure checkout by Stripe. Once your payment is confirmed, return here to sign in.
          </p>
        </section>
      </div>
    </main>
  );
}
