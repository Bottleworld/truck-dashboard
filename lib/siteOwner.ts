import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const SITE_OWNER_COOKIE = "bw_site_owner";
const lifetime = 60 * 60;

function secret() {
  const value = process.env.MANAGER_SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

export function checkSiteOwnerPassword(value: string) {
  const record = process.env.OWNER_PASSWORD_HASH;
  if (!record || typeof value !== "string" || value.length > 128) return false;
  const [saltHex, hashHex] = record.split(":");
  if (!saltHex || !hashHex || !/^[0-9a-f]{32}$/.test(saltHex) || !/^[0-9a-f]{128}$/.test(hashHex)) return false;
  try {
    const actual = scryptSync(value, Buffer.from(saltHex, "hex"), 64);
    const target = Buffer.from(hashHex, "hex");
    return timingSafeEqual(actual, target);
  } catch { return false; }
}

export function signSiteOwner() {
  const key = secret();
  if (!key) throw new Error("Session signing unavailable");
  const data = Buffer.from(JSON.stringify({ role: "site-owner", expiry: Date.now() + lifetime * 1000 })).toString("base64url");
  const sig = createHmac("sha256", key).update("owner:" + data).digest("base64url");
  return data + "." + sig;
}

export function validateSiteOwner(value: string | undefined) {
  const key = secret();
  if (!key || !value || value.length > 600) return false;
  const [data, signature, rest] = value.split(".");
  if (!data || !signature || rest) return false;
  try {
    const expected = Buffer.from(createHmac("sha256", key).update("owner:" + data).digest("base64url"), "base64url");
    const received = Buffer.from(signature, "base64url");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return payload.role === "site-owner" && Number.isFinite(payload.expiry) &&
      payload.expiry > Date.now() && payload.expiry <= Date.now() + lifetime * 1000;
  } catch { return false; }
}

export const SITE_OWNER_LIFETIME_SECONDS = lifetime;
