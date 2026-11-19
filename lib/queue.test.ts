import assert from "node:assert/strict"
import { test } from "node:test"

import { estimateWait, formatTicketCode, formatWaitRange } from "./queue.ts"

test("formatTicketCode pads to three digits", () => {
  assert.equal(formatTicketCode("A", 7), "A-007")
  assert.equal(formatTicketCode("B", 123), "B-123")
})

test("estimateWait divides work across active counters", () => {
  const one = estimateWait({ ahead: 6, avgServiceMinutes: 10, activeCounters: 1 })
  const two = estimateWait({ ahead: 6, avgServiceMinutes: 10, activeCounters: 2 })
  assert.equal(one.minutes, 60)
  assert.equal(two.minutes, 30)
})

test("estimateWait range brackets the estimate on 5-minute steps", () => {
  const e = estimateWait({ ahead: 4, avgServiceMinutes: 9, activeCounters: 2 })
  assert.ok(e.low <= e.minutes && e.minutes <= e.high)
  assert.equal(e.low % 5, 0)
  assert.equal(e.high % 5, 0)
})

test("estimateWait treats zero counters as one and never goes negative", () => {
  const e = estimateWait({ ahead: 0, avgServiceMinutes: 10, activeCounters: 0 })
  assert.deepEqual(e, { minutes: 0, low: 0, high: 5 })
})

test("formatWaitRange reads naturally", () => {
  assert.equal(formatWaitRange({ minutes: 1, low: 0, high: 5 }), "kurang dari 5 menit")
  assert.equal(formatWaitRange({ minutes: 6, low: 0, high: 10 }), "di bawah 10 menit")
  assert.equal(formatWaitRange({ minutes: 20, low: 15, high: 25 }), "15-25 menit")
})
