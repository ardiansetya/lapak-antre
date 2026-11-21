import assert from "node:assert/strict"
import { test } from "node:test"

import { dailyQrCode, hashPassword, isValidQrCode, localDate, verifyPassword } from "./crypto.ts"

test("password hash verifies only the right password", () => {
  const stored = hashPassword("rahasia-123")
  assert.ok(verifyPassword("rahasia-123", stored))
  assert.ok(!verifyPassword("rahasia-124", stored))
  assert.ok(!verifyPassword("x", "garbage"))
})

test("daily QR code is stable within a day and changes across days", () => {
  const a = dailyQrCode("secret", "2026-11-21")
  assert.equal(a, dailyQrCode("secret", "2026-11-21"))
  assert.notEqual(a, dailyQrCode("secret", "2026-11-22"))
  assert.ok(isValidQrCode("secret", "2026-11-21", a))
  assert.ok(!isValidQrCode("secret", "2026-11-22", a))
  assert.ok(!isValidQrCode("secret", "2026-11-21", undefined))
})

test("localDate uses the branch time zone", () => {
  // 17:30 UTC on the 21st is already the 22nd in Jakarta (UTC+7).
  const at = new Date("2026-11-21T17:30:00Z")
  assert.equal(localDate("Asia/Jakarta", at), "2026-11-22")
  assert.equal(localDate("UTC", at), "2026-11-21")
})
