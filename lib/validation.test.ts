import assert from "node:assert/strict"
import { test } from "node:test"

import { rules, validate } from "./validation.ts"

test("customer name must be 2-40 characters after trimming", () => {
  assert.ok(rules.customerName(" A "))
  assert.equal(rules.customerName("Nurul"), undefined)
  assert.ok(rules.customerName("x".repeat(41)))
})

test("phone is optional but must look like a phone number when given", () => {
  assert.equal(rules.phone(""), undefined)
  assert.equal(rules.phone("0812-3456-7890"), undefined)
  assert.ok(rules.phone("12345"))
})

test("prefix accepts 1-3 letters in any case", () => {
  assert.equal(rules.prefix("e"), undefined)
  assert.ok(rules.prefix("E1"))
  assert.ok(rules.prefix("ABCD"))
})

test("minutes must be a whole number from 1 to 240", () => {
  assert.equal(rules.minutes("10"), undefined)
  assert.ok(rules.minutes("0"))
  assert.ok(rules.minutes("2.5"))
  assert.ok(rules.minutes("abc"))
})

test("validate collects every failing field and returns undefined when all pass", () => {
  assert.deepEqual(validate({ email: "salah", password: "pendek" }, { email: rules.email, password: rules.newPassword }), {
    email: "Format email belum benar.",
    password: "Kata sandi minimal 8 karakter.",
  })
  assert.equal(validate({ email: "a@b.co" }, { email: rules.email }), undefined)
})
