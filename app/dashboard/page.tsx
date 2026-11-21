import type { Metadata } from "next"
import Link from "next/link"
import { MegaphoneIcon } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { LiveRefresh } from "@/components/queue/live-refresh"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/auth"
import { formatMinutes, formatPercent } from "@/lib/format"
import { getDashboardSummary } from "@/lib/queries"

export const metadata: Metadata = { title: "Ringkasan" }

export default async function DashboardHome() {
  const staff = await requireStaff()
  const summary = await getDashboardSummary(staff)
  const today = new Intl.DateTimeFormat("id-ID", { timeZone: staff.branch.timezone, dateStyle: "full" }).format(new Date())
  const stats = [
    { label: "Tiket hari ini", value: String(summary.total) },
    { label: "Sedang menunggu", value: String(summary.waiting) },
    { label: "Rata-rata menunggu", value: formatMinutes(summary.avgWait) },
    { label: "Tidak hadir", value: `${summary.noShow}`, note: formatPercent(summary.noShowRate) },
  ]

  return (
    <>
      <LiveRefresh branchId={staff.branch.id} version={staff.branch.version} />
      <PageHeader title="Ringkasan hari ini" description={today}>
        <Link href="/dashboard/loket" className={buttonVariants()}>
          <MegaphoneIcon data-icon="inline-start" />
          Buka konsol loket
        </Link>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="font-mono text-4xl font-semibold tracking-tight tabular-nums group-data-[size=sm]/card:text-4xl">
                {s.value}
              </CardTitle>
              {s.note && <CardDescription className="text-xs">{s.note} dari yang dipanggil</CardDescription>}
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Antrean per layanan</CardTitle>
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
              {summary.services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <span className="mr-2 rounded-[3px] bg-board px-1.5 py-0.5 font-mono text-xs text-board-foreground">{s.prefix}</span>
                    {s.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isOpen ? "default" : "outline"}>{s.isOpen ? "Buka" : "Tutup"}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.waiting}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.activeCounters}</TableCell>
                  <TableCell className="text-right">{s.isOpen ? s.estimateText : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
