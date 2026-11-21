// Tenant isolation check against the running dev server (npm run dev, seeded DB).
// Creates a second tenant with its own session, opens every dashboard page as that tenant,
// and fails if any of the demo clinic's data shows up. Also tries the demo clinic's counter id.
// Run: npm run check:isolation
import "dotenv/config"
import assert from "node:assert/strict"
import { createHash, randomBytes } from "node:crypto"

import { PrismaClient } from "../generated/prisma/client"
import { hashPassword } from "../lib/crypto"
import { createAdapter } from "../lib/db-adapter"

const BASE = process.env.BASE_URL ?? "http://localhost:3100"
const db = new PrismaClient({ adapter: createAdapter() })
// Strings that exist only in the seeded demo clinic.
const DEMO_ONLY = ["Kasih Ibu", "Poli Gigi", "Ruang Periksa", "Loket Apotek", "Margonda"]

async function main() {
  const demoCounter = await db.counter.findFirstOrThrow({ where: { name: "Ruang Gigi" }, select: { id: true } })
  const email = `isolasi-${Date.now()}@contoh.test`
  const user = await db.user.create({ data: { email, name: "Isolasi Uji", passwordHash: hashPassword(randomBytes(12).toString("hex")) } })
  const tenant = await db.tenant.create({
    data: { slug: `isolasi-${Date.now()}`, name: "Isolasi Uji", members: { create: { userId: user.id, role: "OWNER" } } },
  })
  const branch = await db.branch.create({ data: { tenantId: tenant.id, slug: "utama", name: "Cabang Uji", qrSecret: "x" } })
  const service = await db.service.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: "Layanan Uji", prefix: "U", isOpen: true },
  })
  await db.counter.create({
    data: { tenantId: tenant.id, branchId: branch.id, name: "Loket Uji", services: { create: { serviceId: service.id } } },
  })
  const token = randomBytes(32).toString("base64url")
  await db.session.create({
    data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3_600_000) },
  })

  try {
    const pages = ["/dashboard", `/dashboard/loket?loket=${demoCounter.id}`, "/dashboard/layanan", "/dashboard/laporan", "/dashboard/qr"]
    for (const path of pages) {
      const res = await fetch(BASE + path, { headers: { cookie: `la_session=${token}` }, redirect: "manual" })
      const html = await res.text()
      assert.equal(res.status, 200, `${path} returned ${res.status}`)
      assert.ok(html.includes("Isolasi Uji"), `${path} does not show the test tenant`)
      for (const leak of DEMO_ONLY) assert.ok(!html.includes(leak), `${path} leaks demo data: "${leak}"`)
      console.log(`ok   ${path}`)
    }
    console.log("ok: a second tenant sees none of the demo clinic's data, even with its counter id in the URL")
  } finally {
    await db.tenant.delete({ where: { id: tenant.id } })
    await db.user.delete({ where: { id: user.id } })
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
