import { createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE_NAME = "bw_site_owner";
export const OWNER_SESSION_SECONDS = 3600;

function sessionKey(): string | null {
  const value = process.env.MANAGER_SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

export function ownerPasswordMatches(input: string): boolean {
  const configured = process.env.OWNER_ACCESS_PASSWORD;
  if (!configured || input.length > 128) return false;
  const candidateHash = createHmac("sha256", configured).update(input).digest();
  const expectedHash = createHmac("sha256", configured).update(configured).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export function createOwnerCookie(): string {
  const secret = sessionKey();
  if (!secret) throw new Error("Owner session unavailable");
  const payload = Buffer.from(JSON.stringify({
    role: "site-owner",
    exp: Date.now() + OWNER_SESSION_SECONDS * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update("owner:" + payload).digest("base64url");
  return payload + "." + signature;
}

export function isOwnerCookieValid(token: string | undefined): boolean {
  const secret = sessionKey();
  if (!secret || !token || token.length > 1024) return false;
  const [payload, signature, other] = token.split(".");
  if (!payload || !signature || other) return false;
  try {
    const expected = Buffer.from(createHmac("sha256", secret).update("owner:" + payload).digest("base64url"), "base64url");
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) return false;
    const value: { role?: string; exp?: number } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return value.role === "site-owner" &&
      typeof value.exp === "number" && value.exp > Date.now() &&
      value.exp <= Date.now() + OWNER_SESSION_SECONDS * 1000;
  } catch { return false; }
}
