import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "bw_admin_session";
export const ADMIN_SESSION_SECONDS = 4 * 60 * 60;

function sign(value: string): string {
  const secret = process.env.MANAGER_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Session signing unavailable");
  return createHmac("sha256", secret).update("admin:" + value).digest("base64url");
}

export function verifyAdminPassword(password: string): boolean {
  if (!password || password.length > 256) return false;
  const configured = [process.env.ADMIN_SECRET, process.env.ADMIN_LOGIN_PASSWORD, process.env.NEXT_PUBLIC_ADMIN_PASSWORD]
    .filter((value): value is string => Boolean(value));
  return configured.some((value) => {
    const correct = createHmac("sha256", value).update(value).digest();
    const supplied = createHmac("sha256", value).update(password).digest();
    return timingSafeEqual(correct, supplied);
  });
}

export function createAdminCookie(): string {
  const payload = Buffer.from(JSON.stringify({ role: "admin", expires: Date.now() + ADMIN_SESSION_SECONDS * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}

export function verifyAdminCookie(cookie: string | undefined): boolean {
  if (!cookie || cookie.length > 1024) return false;
  const [payload, received, other] = cookie.split(".");
  if (!payload || !received || other) return false;
  try {
    const expected = Buffer.from(sign(payload), "base64url");
    const given = Buffer.from(received, "base64url");
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.role === "admin" && Number.isFinite(session.expires) &&
      session.expires > Date.now() && session.expires <= Date.now() + ADMIN_SESSION_SECONDS * 1000;
  } catch {
    return false;
  }
}
