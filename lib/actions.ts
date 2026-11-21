"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createSession, destroySession, requireStaff, type Staff } from "@/lib/auth"
import { hashPassword, isValidQrCode, localDate, randomToken, verifyPassword } from "@/lib/crypto"
import { db } from "@/lib/db"
import { estimateWait, formatTicketCode } from "@/lib/queue"
import { todayFor } from "@/lib/queries"
import { nextTicketNumber } from "@/lib/ticket-number"

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim()
const bump = (branchId: string) => db.branch.update({ where: { id: branchId }, data: { version: { increment: 1 } } })

// ---------- Public: customers ----------

export async function takeTicket(_prev: FormState, data: FormData): Promise<FormState> {
  const name = text(data, "name")
  const phone = text(data, "phone").replace(/[^\d+]/g, "")
  const serviceId = text(data, "serviceId")
  if (name.length < 2 || name.length > 40)
    return { fieldErrors: { name: "Isi nama panggilan 2-40 huruf supaya petugas bisa memanggil Anda." } }
  if (phone && !/^\+?\d{9,15}$/.test(phone)) return { fieldErrors: { phone: "Nomor HP belum benar." } }

  const service = await db.service.findUnique({ where: { id: serviceId }, include: { branch: true } })
  if (!service || service.branch.slug !== text(data, "branch")) return { error: "Layanan tidak ditemukan." }
  const { branch } = service
  if (!isValidQrCode(branch.qrSecret, localDate(branch.timezone), text(data, "k")))
    return { error: "QR sudah kedaluwarsa. Scan ulang QR yang terpasang di lokasi." }
  if (!service.isOpen) return { error: `${service.name} sedang tutup.` }

  // One active ticket per device per service: send people back to the ticket they already have.
  const jar = await cookies()
  const cookieName = `la_t_${service.id}`
  const existing = jar.get(cookieName)?.value
  if (existing) {
    const active = await db.ticket.findFirst({
      where: { accessToken: existing, status: { in: ["WAITING", "CALLED", "SERVING"] } },
      select: { accessToken: true },
    })
    if (active) redirect(`/tiket/${active.accessToken}`)
  }

  const date = todayFor(branch.timezone)
  if (service.dailyQuota != null) {
    const taken = await db.ticket.count({ where: { serviceId: service.id, date } })
    if (taken >= service.dailyQuota) return { error: `Kuota ${service.name} hari ini sudah habis.` }
  }

  const [waiting, activeCounters] = await Promise.all([
    db.ticket.count({ where: { serviceId: service.id, date, status: "WAITING" } }),
    db.counterService.count({ where: { serviceId: service.id, counter: { isActive: true } } }),
  ])
  const predicted = estimateWait({ ahead: waiting, avgServiceMinutes: service.defaultMinutes, activeCounters })

  const token = randomToken()
  await db.$transaction(async (tx) => {
    const number = await nextTicketNumber(tx, service.id, date)
    await tx.ticket.create({
      data: {
        tenantId: service.tenantId,
        branchId: branch.id,
        serviceId: service.id,
        date,
        number,
        code: formatTicketCode(service.prefix, number),
        accessToken: token,
        name,
        phone: phone || null,
        predictedMinutes: Math.round(predicted.minutes),
      },
    })
    await tx.branch.update({ where: { id: branch.id }, data: { version: { increment: 1 } } })
  })
  // shortcut: no per-IP rate limit yet; add one (e.g. Upstash) before real traffic
  jar.set(cookieName, token, { httpOnly: true, sameSite: "lax", maxAge: 86_400, path: "/" })
  redirect(`/tiket/${token}`)
}

export async function cancelTicket(token: string) {
  if (token === "demo") return { error: "Tiket contoh tidak bisa dibatalkan. Ambil nomor sendiri untuk mencoba." }
  const ticket = await db.ticket.findUnique({ where: { accessToken: token } })
  if (!ticket || !["WAITING", "CALLED"].includes(ticket.status)) return { error: "Tiket ini sudah tidak aktif." }
  await db.ticket.update({ where: { id: ticket.id }, data: { status: "CANCELLED" } })
  await bump(ticket.branchId)
  revalidatePath(`/tiket/${token}`)
}

// ---------- Staff: counter console ----------

async function staffTicket(staff: Staff, ticketId: string) {
  return db.ticket.findFirst({ where: { id: ticketId, tenantId: staff.tenant.id, branchId: staff.branch.id } })
}

async function afterStaffChange(branchId: string) {
  await bump(branchId)
  revalidatePath("/dashboard", "layout")
}

export async function callNext(counterId: string) {
  const staff = await requireStaff()
  const counter = await db.counter.findFirst({
    where: { id: counterId, branchId: staff.branch.id, tenantId: staff.tenant.id, isActive: true },
    include: { services: { select: { serviceId: true } } },
  })
  if (!counter) return { error: "Loket tidak ditemukan." }
  const date = todayFor(staff.branch.timezone)
  const busy = await db.ticket.count({ where: { counterId, date, status: { in: ["CALLED", "SERVING"] } } })
  if (busy) return { error: "Selesaikan pelanggan yang sedang dilayani dulu." }

  // Two counters can race for the same ticket: claim with a conditional update and retry.
  for (let attempt = 0; attempt < 3; attempt++) {
    const next = await db.ticket.findFirst({
      where: { serviceId: { in: counter.services.map((s) => s.serviceId) }, date, status: "WAITING" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
    if (!next) return { error: "Tidak ada yang menunggu." }
    const claimed = await db.ticket.updateMany({
      where: { id: next.id, status: "WAITING" },
      data: { status: "CALLED", counterId, calledAt: new Date(), callCount: 1 },
    })
    if (claimed.count === 1) return afterStaffChange(staff.branch.id)
  }
  return { error: "Antrean sedang ramai, coba lagi." }
}

type Transition = "recall" | "start" | "finish" | "noShow" | "restore"

export async function updateTicket(ticketId: string, action: Transition) {
  const staff = await requireStaff()
  const ticket = await staffTicket(staff, ticketId)
  if (!ticket) return { error: "Tiket tidak ditemukan." }
  const now = new Date()
  const rules: Record<Transition, { from: string[]; data: object }> = {
    recall: { from: ["CALLED"], data: { callCount: { increment: 1 }, calledAt: now } },
    start: { from: ["CALLED"], data: { status: "SERVING", servingAt: now } },
    finish: { from: ["CALLED", "SERVING"], data: { status: "DONE", servingAt: ticket.servingAt ?? now, doneAt: now } },
    noShow: { from: ["CALLED"], data: { status: "NO_SHOW", doneAt: now } },
    restore: { from: ["NO_SHOW"], data: { status: "WAITING", counterId: null, calledAt: null, doneAt: null, callCount: 0 } },
  }
  const rule = rules[action]
  if (!rule.from.includes(ticket.status)) return { error: "Status tiket sudah berubah. Muat ulang halaman." }
  if (action === "recall" && ticket.callCount >= 3) return { error: "Sudah dipanggil 3 kali." }
  await db.ticket.update({ where: { id: ticket.id }, data: rule.data })
  return afterStaffChange(staff.branch.id)
}

// ---------- Staff: services ----------

export async function setServiceOpen(serviceId: string, isOpen: boolean) {
  const staff = await requireStaff()
  const updated = await db.service.updateMany({
    where: { id: serviceId, tenantId: staff.tenant.id, branchId: staff.branch.id },
    data: { isOpen },
  })
  if (!updated.count) return { error: "Layanan tidak ditemukan." }
  return afterStaffChange(staff.branch.id)
}

export async function addService(_prev: FormState, data: FormData): Promise<FormState> {
  const staff = await requireStaff()
  const name = text(data, "name")
  const prefix = text(data, "prefix").toUpperCase()
  const minutes = Number(text(data, "minutes"))
  const fieldErrors: Record<string, string> = {}
  if (name.length < 3 || name.length > 60) fieldErrors.name = "Nama layanan 3-60 huruf."
  if (!/^[A-Z]{1,3}$/.test(prefix)) fieldErrors.prefix = "Gunakan 1-3 huruf, misalnya E."
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) fieldErrors.minutes = "Isi antara 1 dan 240 menit."
  if (Object.keys(fieldErrors).length) return { fieldErrors }
  if (await db.service.findFirst({ where: { branchId: staff.branch.id, prefix } }))
    return { fieldErrors: { prefix: `Huruf ${prefix} sudah dipakai layanan lain.` } }

  const counters = await db.counter.findMany({ where: { branchId: staff.branch.id, isActive: true }, select: { id: true } })
  await db.service.create({
    data: {
      tenantId: staff.tenant.id,
      branchId: staff.branch.id,
      name,
      prefix,
      defaultMinutes: minutes,
      // shortcut: new services are served by every active counter; add per-counter assignment UI later
      counters: { create: counters.map((c) => ({ counterId: c.id })) },
    },
  })
  await afterStaffChange(staff.branch.id)
}

// ---------- Auth ----------

const RESERVED_SLUGS = new Set(["api", "dashboard", "daftar", "masuk", "tiket", "demo", "manifest.webmanifest", "robots.txt", "sitemap.xml"])

export async function login(_prev: FormState, data: FormData): Promise<FormState> {
  const email = text(data, "email").toLowerCase()
  const password = String(data.get("password") ?? "")
  const user = await db.user.findUnique({ where: { email } })
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !verifyPassword(password, user.passwordHash)) return { error: "Email atau kata sandi salah." }
  await createSession(user.id)
  redirect("/dashboard")
}

export async function register(_prev: FormState, data: FormData): Promise<FormState> {
  const business = text(data, "business")
  const email = text(data, "email").toLowerCase()
  const password = String(data.get("password") ?? "")
  const fieldErrors: Record<string, string> = {}
  if (business.length < 3 || business.length > 80) fieldErrors.business = "Nama usaha 3-80 huruf."
  if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Format email belum benar."
  if (password.length < 8) fieldErrors.password = "Kata sandi minimal 8 karakter."
  if (Object.keys(fieldErrors).length) return { fieldErrors }
  if (await db.user.findUnique({ where: { email } })) return { fieldErrors: { email: "Email ini sudah terdaftar." } }

  const base = business.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "usaha"
  // Tenant slugs share the URL root with app routes, so those names are never handed out.
  const taken = RESERVED_SLUGS.has(base) || (await db.tenant.findUnique({ where: { slug: base } }))
  const slug = taken ? `${base}-${randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, "x")}` : base

  const user = await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, name: business, passwordHash: hashPassword(password) } })
    const tenant = await tx.tenant.create({
      data: { slug, name: business, members: { create: { userId: user.id, role: "OWNER" } } },
    })
    const branch = await tx.branch.create({
      data: { tenantId: tenant.id, slug: "utama", name: "Cabang Utama", qrSecret: randomToken() },
    })
    const service = await tx.service.create({
      data: { tenantId: tenant.id, branchId: branch.id, name: "Layanan Umum", prefix: "A", isOpen: true },
    })
    await tx.counter.create({
      data: { tenantId: tenant.id, branchId: branch.id, name: "Loket 1", services: { create: { serviceId: service.id } } },
    })
    return user
  })
  await createSession(user.id)
  redirect("/dashboard")
}

export async function logout() {
  await destroySession()
  redirect("/masuk")
}
