// Fires 40 concurrent number allocations at one service/day and checks they come out 1..40 with no duplicates.
// Run: npm run check:race   (needs DATABASE_URL and a seeded DB)
import "dotenv/config"
import assert from "node:assert/strict"

import { PrismaClient } from "../generated/prisma/client"
import { createAdapter } from "../lib/db-adapter"
import { nextTicketNumber } from "../lib/ticket-number"

const db = new PrismaClient({ adapter: createAdapter() })
const N = 40
const date = new Date("2000-01-01T00:00:00Z") // a day no real ticket uses

async function main() {
  const service = await db.service.findFirstOrThrow({ select: { id: true } })
  await db.dailyCounter.deleteMany({ where: { serviceId: service.id, date } })
  try {
    const numbers = await Promise.all(
      // 40 transactions queue on one row through a 5-connection pool; over a remote link (TiDB) that exceeds Prisma's 2 s default wait.
      Array.from({ length: N }, () =>
        db.$transaction((tx) => nextTicketNumber(tx, service.id, date), { maxWait: 60_000, timeout: 60_000 }),
      ),
    )
    const sorted = numbers.toSorted((a, b) => a - b)
    assert.deepEqual(sorted, Array.from({ length: N }, (_, i) => i + 1))
    console.log(`ok: ${N} concurrent allocations produced 1..${N} with no duplicates`)
  } finally {
    await db.dailyCounter.deleteMany({ where: { serviceId: service.id, date } })
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
