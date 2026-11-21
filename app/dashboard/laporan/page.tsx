import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { EstimateAccuracyChart, HourlyVolumeChart } from "@/components/dashboard/report-charts"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireStaff } from "@/lib/auth"
import { formatMinutes, formatPercent } from "@/lib/format"
import { getReport } from "@/lib/queries"

export const metadata: Metadata = { title: "Laporan" }

export default async function ReportsPage() {
  const staff = await requireStaff()
  const { hourly, accuracy, summary } = await getReport(staff)
  const stats = [
    { label: "Tiket 7 hari", value: String(summary.total) },
    { label: "Rata-rata menunggu", value: formatMinutes(summary.avgWait) },
    { label: "Rata-rata layanan", value: formatMinutes(summary.avgService) },
    { label: "Tingkat tidak hadir", value: formatPercent(summary.noShowRate) },
  ]
  return (
    <>
      <PageHeader title="Laporan" description={`7 hari terakhir, ${staff.branch.name}.`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="font-mono text-4xl font-semibold tracking-tight tabular-nums group-data-[size=sm]/card:text-4xl">
                {s.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <HourlyVolumeChart data={hourly} />
        <EstimateAccuracyChart data={accuracy} />
      </div>
    </>
  )
}
