import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const MANAGER_COOKIE = "bw_manager_session";
export const MANAGER_SESSION_SECONDS = 7 * 24 * 60 * 60;

type Credential = { salt: string; hash: string };

export function validPassword(manager: string, password: string): boolean {
  if (!manager || typeof password !== "string" || password.length > 256) return false;
  try {
    const credentials = JSON.parse(process.env.MANAGER_CREDENTIALS ?? "{}") as Record<string, Credential>;
    const credential = credentials[manager];
    if (!credential?.salt || !credential?.hash) return false;
    const salt = Buffer.from(credential.salt, "hex");
    const expected = Buffer.from(credential.hash, "hex");
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function signingSecret(): string | null {
  const secret = process.env.MANAGER_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function createManagerSession(manager: string): string {
  const secret = signingSecret();
  if (!secret || !["VANESSA", "DOSTON", "BOBIR"].includes(manager)) {
    throw new Error("Manager sessions are not configured");
  }
  const expires = Date.now() + MANAGER_SESSION_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ manager, expires }), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyManagerSession(session: string | undefined): string | null {
  const secret = signingSecret();
  if (!secret || !session || session.length > 1024) return null;
  const [payload, signature, extra] = session.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"), "base64url");
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { manager?: unknown; expires?: unknown };
    if (typeof decoded.manager !== "string" || !["VANESSA", "DOSTON", "BOBIR"].includes(decoded.manager)) return null;
    if (typeof decoded.expires !== "number" || decoded.expires <= Date.now() || decoded.expires > Date.now() + MANAGER_SESSION_SECONDS * 1000) return null;
    return decoded.manager;
  } catch {
    return null;
  }
}
