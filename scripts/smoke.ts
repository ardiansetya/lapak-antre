// Smoke test against the running dev server (no browser). Creates a throwaway staff session for the demo user.
import "dotenv/config"
import { createHash, randomBytes } from "node:crypto"

import { PrismaClient } from "../generated/prisma/client"
import { createAdapter } from "../lib/db-adapter"
import { dailyQrCode, localDate } from "../lib/crypto"

const BASE = "http://localhost:3100"
const db = new PrismaClient({ adapter: createAdapter() })

async function get(path: string, cookie?: string) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: cookie ? { cookie } : {} })
  return { status: res.status, location: res.headers.get("location"), body: res.status === 200 ? await res.text() : "" }
}

async function main() {
  const branch = await db.branch.findFirstOrThrow({ where: { slug: "margonda" } })
  const k = dailyQrCode(branch.qrSecret, localDate(branch.timezone))
  const user = await db.user.findUniqueOrThrow({ where: { email: "demo@lapakantre.test" } })
  const token = randomBytes(32).toString("base64url")
  const session = await db.session.create({
    data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3_600_000) },
  })
  const cookie = `la_session=${token}`

  const checks: [string, string | undefined, string][] = [
    ["/", undefined, "Antre tanpa"],
    ["/masuk", undefined, "Masuk ke dashboard"],
    ["/daftar", undefined, "Buat akun usaha"],
    [`/klinik-kasih-ibu/margonda?k=${k}`, undefined, "Ambil nomor"],
    ["/klinik-kasih-ibu/margonda?k=wrongcode", undefined, "Scan QR di lokasi"],
    ["/tiket/demo", undefined, "orang di depan Anda"],
    ["/klinik-kasih-ibu/margonda/display", undefined, "Nomor dipanggil"],
    ["/dashboard", cookie, "Ringkasan hari ini"],
    ["/dashboard/loket", cookie, "Konsol loket"],
    ["/dashboard/layanan", cookie, "Layanan &amp; loket"],
    ["/dashboard/laporan", cookie, "Akurasi perkiraan"],
    ["/dashboard/qr", cookie, "Scan untuk ambil nomor"],
  ]
  let failed = 0
  for (const [path, c, expect] of checks) {
    const r = await get(path, c)
    const ok = r.status === 200 && r.body.includes(expect)
    if (!ok) failed++
    console.log(`${ok ? "ok  " : "FAIL"} ${r.status} ${path}${ok ? "" : `  (expected "${expect}")`}`)
  }

  // Redirects that must happen.
  const demo = await get("/demo")
  console.log(`${demo.status === 307 && demo.location?.includes(`k=${k}`) ? "ok  " : "FAIL"} ${demo.status} /demo -> ${demo.location}`)
  const guard = await get("/dashboard")
  console.log(`${guard.status === 307 && guard.location?.includes("/masuk") ? "ok  " : "FAIL"} ${guard.status} /dashboard without session -> ${guard.location}`)

  // SSE: first bytes arrive and the stream announces the retry interval.
  const ctrl = new AbortController()
  const sse = await fetch(`${BASE}/api/branches/${branch.id}/events?v=${branch.version}`, { signal: ctrl.signal })
  const reader = sse.body!.getReader()
  const first = new TextDecoder().decode((await reader.read()).value)
  ctrl.abort()
  console.log(`${sse.headers.get("content-type")?.startsWith("text/event-stream") && first.includes("retry:") ? "ok  " : "FAIL"} SSE ${JSON.stringify(first)}`)

  await db.session.delete({ where: { id: session.id } })
  await db.$disconnect()
  if (failed) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
