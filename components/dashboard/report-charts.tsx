"use client"

import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/format"

// Single series each, so one color: --chart-1 (dark olive on light, lime on dark).
const volumeConfig = { tiket: { label: "Tiket", color: "var(--chart-1)" } } satisfies ChartConfig
const accuracyConfig = { mae: { label: "Selisih rata-rata", color: "var(--chart-1)" } } satisfies ChartConfig

function NoData({ text }: { text: string }) {
  return (
    <Empty className="h-64">
      <EmptyHeader>
        <EmptyTitle>Belum ada data</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function HourlyVolumeChart({ data }: { data: { hour: string; tiket: number }[] }) {
  const peak = data.reduce<{ hour: string; tiket: number } | null>((max, d) => (!max || d.tiket > max.tiket ? d : max), null)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tiket per jam</CardTitle>
        <CardDescription>
          Rata-rata per hari, 4 minggu terakhir.{peak && ` Jam tersibuk ${peak.hour}.00.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={volumeConfig} className="aspect-auto h-64 w-full">
            <BarChart data={data} margin={{ top: 8, left: 0, right: 8 }} barCategoryGap={3}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tickFormatter={(h) => `${h}.00`} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip cursor content={<ChartTooltipContent labelFormatter={(h) => `Pukul ${h}.00`} />} />
              <Bar dataKey="tiket" fill="var(--color-tiket)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        ) : (
          <NoData text="Grafik muncul setelah ada tiket." />
        )}
      </CardContent>
    </Card>
  )
}

export function EstimateAccuracyChart({ data }: { data: { day: string; mae: number }[] }) {
  const last = data.length - 1
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Akurasi perkiraan waktu tunggu</CardTitle>
        <CardDescription>
          Selisih rata-rata antara perkiraan saat ambil nomor dan waktu tunggu sebenarnya (MAE). Makin rendah makin akurat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">Grafik</TabsTrigger>
              <TabsTrigger value="table">Tabel</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <ChartContainer config={accuracyConfig} className="aspect-auto h-64 w-full">
                <LineChart data={data} margin={{ top: 16, left: 0, right: 48 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={44} domain={[0, "auto"]} tickFormatter={(v) => `${v} m`} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Line
                    dataKey="mae"
                    type="monotone"
                    stroke="var(--color-mae)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-mae)" }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                  >
                    <LabelList
                      dataKey="mae"
                      content={({ x, y, index, value }) =>
                        index === last ? (
                          <text x={Number(x) + 8} y={Number(y) + 4} className="fill-foreground text-xs">
                            {`${formatNumber(Number(value))} m`}
                          </text>
                        ) : null
                      }
                    />
                  </Line>
                </LineChart>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Selisih rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.day}>
                      <TableCell>{d.day}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatNumber(d.mae)} mnt</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        ) : (
          <NoData text="Muncul setelah ada pelanggan yang dipanggil." />
        )}
      </CardContent>
    </Card>
  )
}
