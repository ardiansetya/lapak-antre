// Sample data so the frontend can be built before the backend exists.
// Replace these lookups with Prisma queries in M1.

import { formatTicketCode, type Counter, type Service, type Ticket } from "@/lib/queue"

export const DEMO_TENANT = {
  slug: "klinik-kasih-ibu",
  name: "Klinik Pratama Kasih Ibu",
} as const

export const DEMO_BRANCH = {
  slug: "margonda",
  name: "Cabang Margonda",
  address: "Jl. Margonda Raya No. 214, Depok",
  hours: "Senin-Sabtu, 07.30-20.00",
} as const

export const SERVICES: Service[] = [
  {
    id: "svc-umum",
    name: "Poli Umum",
    prefix: "A",
    description: "Pemeriksaan dokter umum",
    isOpen: true,
    avgServiceMinutes: 9,
    activeCounters: 2,
    notifyAhead: 3,
    dailyQuota: 120,
  },
  {
    id: "svc-gigi",
    name: "Poli Gigi",
    prefix: "B",
    description: "Konsultasi dan perawatan gigi",
    isOpen: true,
    avgServiceMinutes: 18,
    activeCounters: 1,
    notifyAhead: 2,
    dailyQuota: 30,
  },
  {
    id: "svc-obat",
    name: "Ambil Obat",
    prefix: "C",
    description: "Penebusan resep di apotek klinik",
    isOpen: true,
    avgServiceMinutes: 4,
    activeCounters: 1,
    notifyAhead: 3,
    dailyQuota: null,
  },
  {
    id: "svc-lab",
    name: "Laboratorium",
    prefix: "D",
    description: "Cek darah dan urine",
    isOpen: false,
    avgServiceMinutes: 12,
    activeCounters: 0,
    notifyAhead: 3,
    dailyQuota: 40,
  },
]

export const COUNTERS: Counter[] = [
  { id: "ctr-1", name: "Ruang Periksa 1", serviceIds: ["svc-umum"], isActive: true },
  { id: "ctr-2", name: "Ruang Periksa 2", serviceIds: ["svc-umum"], isActive: true },
  { id: "ctr-3", name: "Ruang Gigi", serviceIds: ["svc-gigi"], isActive: true },
  { id: "ctr-4", name: "Loket Apotek", serviceIds: ["svc-obat"], isActive: true },
]

const NAMES = [
  "Dewi Lestari", "Agus Prasetyo", "Wahyu Hidayat", "Nurul Aini", "Fajar Ramadhan",
  "Yohana Simanjuntak", "Komang Ayu", "Hendra Gunawan", "Putri Maharani", "Rizky Maulana",
  "Lina Marlina", "Teguh Wibowo", "Sri Wahyuni", "Andreas Tanoto", "Intan Permata",
]

function makeTickets(service: Service, first: number, count: number, startMinute: number): Ticket[] {
  return Array.from({ length: count }, (_, i) => {
    const number = first + i
    const minute = startMinute + i * 4
    return {
      id: `${service.id}-${number}`,
      number,
      code: formatTicketCode(service.prefix, number),
      serviceId: service.id,
      name: NAMES[(number + service.prefix.charCodeAt(0)) % NAMES.length],
      status: "WAITING",
      takenAt: `${String(9 + Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    }
  })
}

export const WAITING_TICKETS: Ticket[] = [
  ...makeTickets(SERVICES[0], 14, 7, 12),
  ...makeTickets(SERVICES[1], 6, 3, 20),
  ...makeTickets(SERVICES[2], 21, 5, 31),
]

/** Ticket currently shown on each counter (for display + dashboard). */
export const NOW_SERVING: { counterId: string; code: string }[] = [
  { counterId: "ctr-1", code: "A-012" },
  { counterId: "ctr-2", code: "A-013" },
  { counterId: "ctr-3", code: "B-005" },
  { counterId: "ctr-4", code: "C-020" },
]

export function getService(id: string) {
  return SERVICES.find((s) => s.id === id)
}

export function waitingFor(serviceId: string) {
  return WAITING_TICKETS.filter((t) => t.serviceId === serviceId)
}

/** Demo ticket used by the /tiket/[token] page. */
export const DEMO_TICKET = {
  token: "demo",
  code: "A-017",
  serviceId: "svc-umum",
  name: "Nurul",
  aheadAtStart: 4,
} as const

// Hourly volume for the report chart (sample, not real data).
export const HOURLY_VOLUME = [
  { hour: "07", tiket: 6 },
  { hour: "08", tiket: 19 },
  { hour: "09", tiket: 27 },
  { hour: "10", tiket: 31 },
  { hour: "11", tiket: 22 },
  { hour: "12", tiket: 9 },
  { hour: "13", tiket: 14 },
  { hour: "14", tiket: 17 },
  { hour: "15", tiket: 21 },
  { hour: "16", tiket: 25 },
  { hour: "17", tiket: 18 },
  { hour: "18", tiket: 11 },
  { hour: "19", tiket: 5 },
]

// Seven-day accuracy of the wait estimate, in minutes (sample).
export const ESTIMATE_ACCURACY = [
  { day: "12 Nov", baseline: 7.8, model: 7.9 },
  { day: "13 Nov", baseline: 8.4, model: 7.1 },
  { day: "14 Nov", baseline: 9.6, model: 6.8 },
  { day: "15 Nov", baseline: 7.2, model: 5.9 },
  { day: "17 Nov", baseline: 6.9, model: 5.4 },
  { day: "18 Nov", baseline: 7.4, model: 5.1 },
  { day: "19 Nov", baseline: 6.6, model: 4.8 },
]
