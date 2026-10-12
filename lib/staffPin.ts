import { createHmac, timingSafeEqual } from "node:crypto";

export function validateStaffPin(pin: string): boolean {
  const expected = process.env.STAFF_EDIT_PASSCODE;
  if (!expected || !/^\d{4}$/.test(pin)) return false;
  const hash1 = createHmac("sha256", expected).update(pin).digest();
  const hash2 = createHmac("sha256", expected).update(expected).digest();
  return timingSafeEqual(hash1, hash2);
}
