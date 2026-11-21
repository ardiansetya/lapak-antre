import "server-only"

import { cache } from "react"

import type { Staff } from "@/lib/auth"
import { dailyQrCode, localDate } from "@/lib/crypto"
import { db } from "@/lib/db"
import { estimateWait, formatWaitRange } from "@/lib/queue"

/** Midnight UTC of the branch's local day, the value stored in `@db.Date` columns. */
export function todayFor(timeZone: string, at = new Date()) {
  return new Date(`${localDate(timeZone, at)}T00:00:00Z`)
}

export function qrCodeForToday(branch: { qrSecret: string; timezone: string }) {
  return dailyQrCode(branch.qrSecret, localDate(branch.timezone))
}

const minutesBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60_000

/** Average SERVING to DONE minutes of today's last 20 finished tickets, else the service default. */
function avgMinutes(done: { servingAt: Date | null; doneAt: Date | null }[], fallback: number) {
  const durations = done
    .filter((t) => t.servingAt && t.doneAt)
    .slice(-20)
    .map((t) => minutesBetween(t.servingAt!, t.doneAt!))
  return durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : fallback
}

/** Per-service queue numbers for one branch and day. */
async function serviceStats(branchId: string, date: Date) {
  const services = await db.service.findMany({
    where: { branchId },
    orderBy: { prefix: "asc" },
    include: {
      counters: { where: { counter: { isActive: true } }, select: { counterId: true } },
      tickets: {
        where: { date, status: { in: ["WAITING", "DONE"] } },
        select: { status: true, servingAt: true, doneAt: true },
        orderBy: { doneAt: "asc" },
      },
    },
  })
  return services.map(({ tickets, counters, ...s }) => {
    const waiting = tickets.filter((t) => t.status === "WAITING").length
    const avg = avgMinutes(tickets.filter((t) => t.status === "DONE"), s.defaultMinutes)
    const activeCounters = counters.length
    return {
      ...s,
      waiting,
      activeCounters,
      avgMinutes: avg,
      estimate: estimateWait({ ahead: waiting, avgServiceMinutes: avg, activeCounters }),
    }
  })
}

// cache(): generateMetadata and the page share one lookup per request.
export const getPublicBranch = cache(async (tenantSlug: string, branchSlug: string) => {
  const branch = await db.branch.findFirst({
    where: { slug: branchSlug, tenant: { slug: tenantSlug } },
    include: { tenant: true },
  })
  if (!branch) return null
  const services = await serviceStats(branch.id, todayFor(branch.timezone))
  return { branch, services }
})

export async function getTicketView(token: string) {
  const ticket = await db.ticket.findUnique({
    where: { accessToken: token },
    include: { counter: true, service: { include: { branch: { include: { tenant: true } } } } },
  })
  if (!ticket) return null
  const { service } = ticket
  const [ahead, serving, stats] = await Promise.all([
    ticket.status === "WAITING"
      ? db.ticket.count({
          where: { serviceId: service.id, date: ticket.date, status: "WAITING", number: { lt: ticket.number } },
        })
      : 0,
    db.ticket.findFirst({
      where: { serviceId: service.id, date: ticket.date, status: { in: ["CALLED", "SERVING", "DONE"] } },
      orderBy: { calledAt: "desc" },
      select: { code: true },
    }),
    serviceStats(service.branchId, ticket.date),
  ])
  const stat = stats.find((s) => s.id === service.id)!
  return {
    token,
    code: ticket.code,
    name: ticket.name,
    status: ticket.status,
    ahead,
    counterName: ticket.counter?.name ?? null,
    servingCode: serving?.code ?? null,
    estimate: formatWaitRange(
      estimateWait({ ahead, avgServiceMinutes: stat.avgMinutes, activeCounters: stat.activeCounters }),
    ),
    notifyAhead: service.notifyAhead,
    serviceName: service.name,
    branchId: service.branch.id,
    version: service.branch.version,
    branchName: service.branch.name,
    tenantName: service.branch.tenant.name,
    takeAgainHref: `/${service.branch.tenant.slug}/${service.branch.slug}`,
  }
}

export async function getDisplay(tenantSlug: string, branchSlug: string) {
  const branch = await db.branch.findFirst({
    where: { slug: branchSlug, tenant: { slug: tenantSlug } },
    include: { tenant: true },
  })
  if (!branch) return null
  const date = todayFor(branch.timezone)
  const [counters, upcoming] = await Promise.all([
    db.counter.findMany({
      where: { branchId: branch.id, isActive: true },
      orderBy: { name: "asc" },
      include: {
        tickets: {
          where: { date, status: { in: ["CALLED", "SERVING"] } },
          orderBy: { calledAt: "desc" },
          take: 1,
          select: { id: true, code: true, calledAt: true, callCount: true },
        },
      },
    }),
    db.service.findMany({
      where: { branchId: branch.id, isOpen: true },
      orderBy: { prefix: "asc" },
      include: {
        tickets: { where: { date, status: "WAITING" }, orderBy: { number: "asc" }, take: 3, select: { code: true } },
      },
    }),
  ])
  const rows = counters.map((c) => ({ id: c.id, name: c.name, ticket: c.tickets[0] ?? null }))
  const latest = rows
    .filter((r) => r.ticket?.calledAt)
    .sort((a, b) => b.ticket!.calledAt!.getTime() - a.ticket!.calledAt!.getTime())[0]
  return {
    branchId: branch.id,
    version: branch.version,
    title: `${branch.tenant.name}, ${branch.name}`,
    counters: rows.map((r) => ({ id: r.id, name: r.name, code: r.ticket?.code ?? null })),
    latest: latest
      ? {
          counterName: latest.name,
          code: latest.ticket!.code,
          // changes on every call and recall, so the display knows when to announce
          callKey: `${latest.ticket!.id}:${latest.ticket!.callCount}`,
        }
      : null,
    upcoming: upcoming.map((s) => ({ service: s.name, codes: s.tickets.map((t) => t.code) })),
  }
}

export async function getConsole(staff: Staff, counterId?: string) {
  const date = todayFor(staff.branch.timezone)
  const counters = await db.counter.findMany({
    where: { branchId: staff.branch.id, isActive: true },
    orderBy: { name: "asc" },
    include: { services: { select: { serviceId: true } } },
  })
  const counter = counters.find((c) => c.id === counterId) ?? counters[0]
  if (!counter) return { counters: [], counter: null }
  const serviceIds = counter.services.map((s) => s.serviceId)
  const ticketFields = { id: true, code: true, name: true, status: true, callCount: true, createdAt: true } as const
  const [current, queue, skipped, history] = await Promise.all([
    db.ticket.findFirst({
      where: { counterId: counter.id, date, status: { in: ["CALLED", "SERVING"] } },
      orderBy: { calledAt: "desc" },
      select: ticketFields,
    }),
    db.ticket.findMany({
      where: { serviceId: { in: serviceIds }, date, status: "WAITING" },
      orderBy: { createdAt: "asc" },
      select: ticketFields,
    }),
    db.ticket.findMany({
      where: { serviceId: { in: serviceIds }, date, status: "NO_SHOW" },
      orderBy: { calledAt: "desc" },
      take: 5,
      select: ticketFields,
    }),
    db.ticket.findMany({
      where: { counterId: counter.id, date, status: { in: ["DONE", "NO_SHOW"] } },
      orderBy: { doneAt: "desc" },
      take: 6,
      select: { id: true, code: true, status: true },
    }),
  ])
  return {
    branchId: staff.branch.id,
    counters: counters.map((c) => ({ id: c.id, name: c.name })),
    counter: { id: counter.id, name: counter.name },
    current,
    queue,
    skipped,
    history,
  }
}

export async function getDashboardSummary(staff: Staff) {
  const date = todayFor(staff.branch.timezone)
  const [tickets, services] = await Promise.all([
    db.ticket.findMany({
      where: { branchId: staff.branch.id, date },
      select: { status: true, createdAt: true, calledAt: true },
    }),
    serviceStats(staff.branch.id, date),
  ])
  const called = tickets.filter((t) => t.calledAt)
  const noShow = tickets.filter((t) => t.status === "NO_SHOW").length
  const avgWait = called.length
    ? called.reduce((sum, t) => sum + minutesBetween(t.createdAt, t.calledAt!), 0) / called.length
    : null
  return {
    total: tickets.length,
    waiting: tickets.filter((t) => t.status === "WAITING").length,
    avgWait,
    noShow,
    noShowRate: called.length ? noShow / called.length : null,
    services: services.map((s) => ({ ...s, estimateText: formatWaitRange(s.estimate) })),
  }
}

export async function getServicesAdmin(staff: Staff) {
  const [services, counters] = await Promise.all([
    db.service.findMany({ where: { branchId: staff.branch.id }, orderBy: { prefix: "asc" } }),
    db.counter.findMany({
      where: { branchId: staff.branch.id },
      orderBy: { name: "asc" },
      include: { services: { select: { serviceId: true } } },
    }),
  ])
  return {
    services,
    counters: counters.map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      serviceIds: c.services.map((s) => s.serviceId),
    })),
  }
}

export async function getReport(staff: Staff) {
  const tz = staff.branch.timezone
  const today = todayFor(tz)
  const since = new Date(today.getTime() - 27 * 86_400_000)
  const tickets = await db.ticket.findMany({
    where: { branchId: staff.branch.id, date: { gte: since } },
    select: { date: true, status: true, createdAt: true, calledAt: true, servingAt: true, doneAt: true, predictedMinutes: true },
  })

  // Average tickets per local hour across the days that had any tickets.
  const hourOf = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" })
  const days = new Set(tickets.map((t) => t.date.getTime())).size || 1
  const perHour = new Map<string, number>()
  for (const t of tickets) {
    const h = hourOf.format(t.createdAt)
    perHour.set(h, (perHour.get(h) ?? 0) + 1)
  }
  const hourly = [...perHour.keys()]
    .sort()
    .map((hour) => ({ hour, tiket: Math.round((perHour.get(hour)! / days) * 10) / 10 }))

  // Mean absolute error of the stored prediction vs the real wait, per day, last 7 days.
  const weekStart = new Date(today.getTime() - 6 * 86_400_000)
  const dayLabel = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short" })
  const errors = new Map<number, number[]>()
  for (const t of tickets) {
    if (t.date < weekStart || !t.calledAt || t.predictedMinutes == null) continue
    const err = Math.abs(minutesBetween(t.createdAt, t.calledAt) - t.predictedMinutes)
    errors.set(t.date.getTime(), [...(errors.get(t.date.getTime()) ?? []), err])
  }
  const accuracy = [...errors.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, list]) => ({
      day: dayLabel.format(new Date(day)),
      mae: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10,
    }))

  const week = tickets.filter((t) => t.date >= weekStart)
  const called = week.filter((t) => t.calledAt)
  const served = week.filter((t) => t.servingAt && t.doneAt)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  return {
    hourly,
    accuracy,
    summary: {
      total: week.length,
      avgWait: avg(called.map((t) => minutesBetween(t.createdAt, t.calledAt!))),
      avgService: avg(served.map((t) => minutesBetween(t.servingAt!, t.doneAt!))),
      noShowRate: called.length ? week.filter((t) => t.status === "NO_SHOW").length / called.length : null,
    },
  }
}
