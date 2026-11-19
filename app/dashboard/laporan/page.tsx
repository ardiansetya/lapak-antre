import type { Metadata } from "next"

import { EstimateAccuracyChart, HourlyVolumeChart } from "@/components/dashboard/report-charts"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ESTIMATE_ACCURACY, HOURLY_VOLUME } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Laporan" }

const SUMMARY = [
  { label: "Tiket minggu ini", value: "864" },
  { label: "Rata-rata menunggu", value: "16 mnt" },
  { label: "Rata-rata layanan", value: "8,7 mnt" },
  { label: "Tingkat tidak hadir", value: "3,9%" },
]

export default function ReportsPage() {
  const latest = ESTIMATE_ACCURACY.at(-1)
  return (
    <>
      <PageHeader title="Laporan" description="13-19 November 2026, Cabang Margonda. Contoh data." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums group-data-[size=sm]/card:text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <HourlyVolumeChart data={HOURLY_VOLUME} />
        <EstimateAccuracyChart data={ESTIMATE_ACCURACY} />
      </div>
      {latest && (
        <p className="max-w-prose text-sm text-muted-foreground">
          Model regresi dipakai untuk pelanggan karena selisihnya ({latest.model.toLocaleString("id-ID")} menit)
          lebih kecil daripada rata-rata harian ({latest.baseline.toLocaleString("id-ID")} menit). Jika model memburuk, sistem kembali ke rata-rata harian.
        </p>
      )}
    </>
  )
}
