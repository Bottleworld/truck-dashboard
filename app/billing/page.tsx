export default function BillingPage() {
  const monthlyLink = "https://buy.stripe.com/dRmcN79Wh8FY5Rf2u714402";
  const yearlyLink = "https://buy.stripe.com/8x24gB7O94pI5Rf7Or14403";

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f7fb",
      padding: "24px"
    }}>
      <div style={{
        maxWidth: "900px",
        width: "100%",
        background: "white",
        borderRadius: "18px",
        padding: "32px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          Bottle World System Subscription
        </h1>

        <p style={{ color: "#555", marginBottom: "28px", fontSize: "16px" }}>
          Choose a plan to keep the truck dashboard, database storage, hosting, and system maintenance active.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px"
        }}>
          <div style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "24px"
          }}>
            <h2>Monthly Plan</h2>
            <p style={{ fontSize: "34px", fontWeight: "bold", margin: "16px 0" }}>
              $89.99<span style={{ fontSize: "16px", color: "#555" }}>/month</span>
            </p>
            <p style={{ color: "#555", minHeight: "48px" }}>
              Monthly database storage, hosting, maintenance, and dashboard access.
            </p>
            <a
              href={monthlyLink}
              style={{
                display: "block",
                marginTop: "24px",
                textAlign: "center",
                background: "#111827",
                color: "white",
                padding: "14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600"
              }}
            >
              Pay Monthly
            </a>
          </div>

          <div style={{
            border: "2px solid #111827",
            borderRadius: "14px",
            padding: "24px",
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: "-12px",
              right: "20px",
              background: "#111827",
              color: "white",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "12px"
            }}>
              Best Value
            </div>

            <h2>Yearly Plan</h2>
            <p style={{ fontSize: "34px", fontWeight: "bold", margin: "16px 0" }}>
              $899<span style={{ fontSize: "16px", color: "#555" }}>/year</span>
            </p>
            <p style={{ color: "#555", minHeight: "48px" }}>
              Save $180.88 per year compared to the monthly plan.
            </p>
            <a
              href={yearlyLink}
              style={{
                display: "block",
                marginTop: "24px",
                textAlign: "center",
                background: "#2563eb",
                color: "white",
                padding: "14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600"
              }}
            >
              Pay Yearly
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}