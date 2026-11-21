// Demo data: one clinic with 14 days of history (for reports) and a live queue for today.
// Idempotent: re-running wipes and recreates only the demo tenant and demo user.
import "dotenv/config"

import { PrismaClient, type Prisma } from "../generated/prisma/client"
import { hashPassword, localDate } from "../lib/crypto"
import { createAdapter } from "../lib/db-adapter"
import { formatTicketCode } from "../lib/queue"

const db = new PrismaClient({ adapter: createAdapter() })

export const DEMO_EMAIL = "demo@lapakantre.test"
const DEMO_PASSWORD = "demo12345"
const TZ = "Asia/Jakarta"
const TZ_OFFSET_MS = 7 * 3_600_000

// Deterministic pseudo-random so every seed produces the same demo.
let state = 42
const rand = () => ((state = (state * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31)
const between = (min: number, max: number) => min + rand() * (max - min)

const NAMES = [
  "Dewi", "Agus", "Wahyu", "Nurul", "Fajar", "Yohana", "Komang", "Hendra", "Putri", "Rizky",
  "Lina", "Teguh", "Sri", "Andreas", "Intan", "Bayu", "Citra", "Gilang", "Maya", "Oki",
]
// Relative arrivals per local hour, 07:00 to 19:00 (busy mornings and late afternoons).
const HOUR_WEIGHTS = [0.3, 1, 1.4, 1.6, 1.1, 0.5, 0.7, 0.9, 1.1, 1.3, 0.9, 0.6, 0.3]

async function main() {
  const old = await db.tenant.findUnique({ where: { slug: "klinik-kasih-ibu" }, include: { branches: { include: { services: true } } } })
  if (old) {
    const serviceIds = old.branches.flatMap((b) => b.services.map((s) => s.id))
    await db.dailyCounter.deleteMany({ where: { serviceId: { in: serviceIds } } })
    await db.tenant.delete({ where: { id: old.id } })
  }
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } })

  const user = await db.user.create({
    data: { email: DEMO_EMAIL, name: "Dr. Ratna Wijaya", passwordHash: hashPassword(DEMO_PASSWORD) },
  })
  const tenant = await db.tenant.create({
    data: { slug: "klinik-kasih-ibu", name: "Klinik Pratama Kasih Ibu", members: { create: { userId: user.id, role: "OWNER" } } },
  })
  const branch = await db.branch.create({
    data: {
      tenantId: tenant.id,
      slug: "margonda",
      name: "Cabang Margonda",
      address: "Jl. Margonda Raya No. 214, Depok",
      hours: "Senin-Sabtu, 07.30-20.00",
      timezone: TZ,
      qrSecret: "demo-qr-secret-margonda",
    },
  })

  const serviceDefs = [
    { name: "Poli Umum", prefix: "A", description: "Pemeriksaan dokter umum", minutes: 9, perDay: 70, notifyAhead: 3, quota: 120 },
    { name: "Poli Gigi", prefix: "B", description: "Konsultasi dan perawatan gigi", minutes: 18, perDay: 18, notifyAhead: 2, quota: 30 },
    { name: "Ambil Obat", prefix: "C", description: "Penebusan resep di apotek klinik", minutes: 4, perDay: 55, notifyAhead: 3, quota: null },
    { name: "Laboratorium", prefix: "D", description: "Cek darah dan urine", minutes: 12, perDay: 0, notifyAhead: 3, quota: 40 },
  ]
  const services = []
  for (const s of serviceDefs) {
    services.push({
      ...s,
      row: await db.service.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: s.name,
          prefix: s.prefix,
          description: s.description,
          isOpen: s.perDay > 0,
          defaultMinutes: s.minutes,
          notifyAhead: s.notifyAhead,
          dailyQuota: s.quota,
        },
      }),
    })
  }
  const [umum, gigi, obat] = services.map((s) => s.row)
  const counters = await Promise.all(
    [
      ["Ruang Periksa 1", umum.id],
      ["Ruang Periksa 2", umum.id],
      ["Ruang Gigi", gigi.id],
      ["Loket Apotek", obat.id],
    ].map(([name, serviceId]) =>
      db.counter.create({
        data: { tenantId: tenant.id, branchId: branch.id, name, services: { create: { serviceId } } },
      }),
    ),
  )

  const tickets: Prisma.TicketCreateManyInput[] = []
  const counterOf = (serviceId: string, i: number) => {
    const own = counters.filter((_, idx) => [umum.id, umum.id, gigi.id, obat.id][idx] === serviceId)
    return own[i % own.length]
  }
  const todayLocal = localDate(TZ)
  const now = Date.now()

  // History: 14 previous days of finished tickets.
  for (let d = 14; d >= 0; d--) {
    const day = new Date(new Date(`${todayLocal}T00:00:00Z`).getTime() - d * 86_400_000)
    const isToday = d === 0
    for (const s of services) {
      if (!s.perDay) continue
      let number = 0
      const total = s.perDay * between(0.8, 1.2)
      const weightSum = HOUR_WEIGHTS.reduce((a, b) => a + b, 0)
      for (let h = 0; h < HOUR_WEIGHTS.length; h++) {
        const count = Math.round((total * HOUR_WEIGHTS[h]) / weightSum)
        for (let i = 0; i < count; i++) {
          const createdAt = new Date(day.getTime() + (7 + h) * 3_600_000 + between(0, 3_600_000) - TZ_OFFSET_MS)
          if (isToday && createdAt.getTime() > now - 50 * 60_000) continue // the live queue below covers the last hour
          number++
          const predicted = Math.round(between(8, 30))
          // The estimate improves over the two weeks, which the accuracy chart shows.
          const noise = between(-1, 1) * (4 + d * 0.5)
          const calledAt = new Date(createdAt.getTime() + Math.max(1, predicted + noise) * 60_000)
          const noShow = rand() < 0.04
          const servingAt = noShow ? null : new Date(calledAt.getTime() + between(1, 3) * 60_000)
          const doneAt = noShow ? calledAt : new Date(servingAt!.getTime() + s.minutes * between(0.6, 1.5) * 60_000)
          tickets.push({
            tenantId: tenant.id,
            branchId: branch.id,
            serviceId: s.row.id,
            counterId: counterOf(s.row.id, number).id,
            date: day,
            number,
            code: formatTicketCode(s.prefix, number),
            accessToken: `seed-${s.prefix}-${d}-${number}`,
            name: NAMES[Math.floor(rand() * NAMES.length)],
            status: noShow ? "NO_SHOW" : "DONE",
            callCount: 1,
            predictedMinutes: predicted,
            createdAt,
            calledAt,
            servingAt,
            doneAt,
          })
        }
      }
      // Today: one ticket in service at each counter, then a waiting line.
      if (isToday) {
        const live = s.prefix === "A" ? 9 : s.prefix === "B" ? 4 : 6
        for (let i = 0; i < live; i++) {
          number++
          const createdAt = new Date(now - (45 - i * 4) * 60_000)
          const inService = i < (s.prefix === "A" ? 2 : 1)
          tickets.push({
            tenantId: tenant.id,
            branchId: branch.id,
            serviceId: s.row.id,
            counterId: inService ? counterOf(s.row.id, i).id : null,
            date: day,
            number,
            code: formatTicketCode(s.prefix, number),
            // The landing page links to this fixed token as the public sample ticket.
            accessToken: s.prefix === "A" && i === 5 ? "demo" : `seed-${s.prefix}-live-${number}`,
            name: NAMES[Math.floor(rand() * NAMES.length)],
            status: inService ? "SERVING" : "WAITING",
            callCount: inService ? 1 : 0,
            predictedMinutes: Math.round(between(8, 30)),
            createdAt,
            calledAt: inService ? new Date(now - 6 * 60_000) : null,
            servingAt: inService ? new Date(now - 4 * 60_000) : null,
          })
        }
      }
      await db.dailyCounter.create({ data: { serviceId: s.row.id, date: day, lastNumber: number } })
    }
  }
  await db.ticket.createMany({ data: tickets })
  console.log(`Seeded ${tickets.length} tickets. Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
