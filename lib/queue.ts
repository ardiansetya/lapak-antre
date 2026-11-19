// Domain types and pure queue logic. Shared by UI now, by server code later.

export type TicketStatus =
  | "WAITING"
  | "CALLED"
  | "SERVING"
  | "DONE"
  | "NO_SHOW"
  | "CANCELLED"

export type Service = {
  id: string
  name: string
  prefix: string
  description: string
  isOpen: boolean
  avgServiceMinutes: number
  activeCounters: number
  notifyAhead: number
  dailyQuota: number | null
}

export type Counter = {
  id: string
  name: string
  serviceIds: string[]
  isActive: boolean
}

export type Ticket = {
  id: string
  number: number
  code: string
  serviceId: string
  name: string
  status: TicketStatus
  /** "HH:MM" local time the ticket was taken */
  takenAt: string
  counterName?: string
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  WAITING: "Menunggu",
  CALLED: "Dipanggil",
  SERVING: "Dilayani",
  DONE: "Selesai",
  NO_SHOW: "Tidak hadir",
  CANCELLED: "Dibatalkan",
}

export function formatTicketCode(prefix: string, number: number) {
  return `${prefix}-${String(number).padStart(3, "0")}`
}

export type WaitEstimate = { minutes: number; low: number; high: number }

/**
 * Baseline estimate from the PRD (section 8, stage 1):
 * people ahead x average service time / active counters,
 * shown as an honest range rounded to 5 minutes.
 */
export function estimateWait({
  ahead,
  avgServiceMinutes,
  activeCounters,
}: {
  ahead: number
  avgServiceMinutes: number
  activeCounters: number
}): WaitEstimate {
  const minutes = (Math.max(0, ahead) * avgServiceMinutes) / Math.max(1, activeCounters)
  const spread = Math.max(3, minutes * 0.25)
  return {
    minutes,
    low: Math.max(0, Math.floor((minutes - spread) / 5) * 5),
    high: Math.max(5, Math.ceil((minutes + spread) / 5) * 5),
  }
}

export function formatWaitRange({ low, high }: WaitEstimate) {
  if (high <= 5) return "kurang dari 5 menit"
  if (low === 0) return `di bawah ${high} menit`
  return `${low}-${high} menit`
}
