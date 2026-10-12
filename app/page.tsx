import { cookies } from "next/headers";
import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";
import ManagerLogin from "./ManagerLogin";
import SubscriptionPaywall from "./SubscriptionPaywall";
import { getSubscriptionAccess } from "@/lib/subscriptionAccess";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const owner = isOwnerCookieValid((await cookies()).get(OWNER_COOKIE_NAME)?.value);
  if (owner) return <ManagerLogin />;
  const access = await getSubscriptionAccess();
  if (access.active) return <ManagerLogin />;

  const sandbox = process.env.VERCEL_ENV !== "production" && process.env.STRIPE_SANDBOX_MODE === "true";
  return (
    <SubscriptionPaywall
      available={access.available}
      sandbox={sandbox}
      monthlyLink={sandbox
        ? "https://buy.stripe.com/test_eVqeVeah52c3gYfaO26oo00"
        : "https://buy.stripe.com/dRmcN79Wh8FY5Rf2u714402"}
      yearlyLink={sandbox
        ? "https://buy.stripe.com/test_6oUdRagFtg2T9vNe0e6oo01"
        : "https://buy.stripe.com/8x24gB7O94pI5Rf7Or14403"}
    />
  );
}
