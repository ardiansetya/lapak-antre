import type { Metadata } from "next"
import Link from "next/link"
import { MegaphoneIcon } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SERVICES, waitingFor } from "@/lib/mock-data"
import { estimateWait, formatWaitRange } from "@/lib/queue"

export const metadata: Metadata = { title: "Ringkasan" }

// Sample figures for today. Will come from aggregated Ticket rows.
const STATS = [
  { label: "Tiket hari ini", value: "142", note: "+18 dari Kamis lalu" },
  { label: "Sedang menunggu", value: "15", note: "di 3 layanan" },
  { label: "Rata-rata menunggu", value: "17 mnt", note: "dari ambil nomor sampai dipanggil" },
  { label: "Tidak hadir", value: "6", note: "4,2% dari yang dipanggil" },
]

export default function DashboardHome() {
  return (
    <>
      <PageHeader title="Ringkasan hari ini" description="Kamis, 19 November 2026. Contoh data.">
        <Link href="/dashboard/loket" className={buttonVariants()}>
          <MegaphoneIcon data-icon="inline-start" />
          Buka konsol loket
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums group-data-[size=sm]/card:text-3xl">{s.value}</CardTitle>
              <CardDescription className="text-xs">{s.note}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Antrean per layanan</CardTitle>
          <CardDescription>Perkiraan memakai rata-rata lama layanan hari ini.</CardDescription>
          <CardAction>
            <Link href="/dashboard/layanan" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Kelola layanan
            </Link>
          </CardAction>
        </CardHeader>
        <div className="overflow-x-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Menunggu</TableHead>
                <TableHead className="text-right">Loket aktif</TableHead>
                <TableHead className="text-right">Perkiraan untuk pendaftar baru</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SERVICES.map((s) => {
                const waiting = waitingFor(s.id).length
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <span className="mr-2 font-mono text-muted-foreground">{s.prefix}</span>
                      {s.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isOpen ? "secondary" : "outline"}>{s.isOpen ? "Buka" : "Tutup"}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{waiting}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.activeCounters}</TableCell>
                    <TableCell className="text-right">
                      {s.isOpen
                        ? formatWaitRange(
                            estimateWait({
                              ahead: waiting,
                              avgServiceMinutes: s.avgServiceMinutes,
                              activeCounters: s.activeCounters,
                            }),
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
