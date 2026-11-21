// Pure crypto helpers (no DB, no Next) so they can be unit tested with node:test.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url")
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

/** scrypt hash in the form `salt:hash`, both hex. */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** "YYYY-MM-DD" for the given instant in an IANA time zone. */
export function localDate(timeZone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at)
}

/** Daily QR code: changes every local day, so yesterday's photo of the poster stops working. */
export function dailyQrCode(qrSecret: string, day: string) {
  return createHmac("sha256", qrSecret).update(day).digest("hex").slice(0, 8)
}

export function isValidQrCode(qrSecret: string, day: string, code: string | undefined) {
  if (!code || code.length !== 8) return false
  return timingSafeEqual(Buffer.from(dailyQrCode(qrSecret, day)), Buffer.from(code))
}
