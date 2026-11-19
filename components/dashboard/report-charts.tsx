"use client"

import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Palette validated with the dataviz validator (light + dark). Aqua/orange categorical slots.
const accuracyConfig = {
  model: { label: "Model regresi", theme: { light: "#1baf7a", dark: "#199e70" } },
  baseline: { label: "Rata-rata harian", theme: { light: "#eb6834", dark: "#d95926" } },
} satisfies ChartConfig

const volumeConfig = {
  tiket: { label: "Tiket", color: "var(--chart-1)" },
} satisfies ChartConfig

type Accuracy = { day: string; baseline: number; model: number }

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 })

export function HourlyVolumeChart({ data }: { data: { hour: string; tiket: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiket per jam</CardTitle>
        <CardDescription>Rata-rata 4 minggu terakhir. Jam tersibuk 10.00 dan 16.00.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={volumeConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ top: 8, left: -16, right: 8 }} barCategoryGap={3}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} tickFormatter={(h) => `${h}.00`} />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip cursor content={<ChartTooltipContent labelFormatter={(h) => `Pukul ${h}.00`} />} />
            <Bar dataKey="tiket" fill="var(--color-tiket)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function EstimateAccuracyChart({ data }: { data: Accuracy[] }) {
  const last = data.length - 1
  return (
    <Card>
      <CardHeader>
        <CardTitle>Akurasi perkiraan waktu tunggu</CardTitle>
        <CardDescription>
          Rata-rata selisih perkiraan dengan waktu tunggu sebenarnya (MAE, menit). Makin rendah makin akurat.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                <ChartLegend content={<ChartLegendContent />} />
                {(["model", "baseline"] as const).map((key) => (
                  <Line
                    key={key}
                    dataKey={key}
                    type="monotone"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                  >
                    {/* Direct label on the last point only, in text ink. */}
                    <LabelList
                      dataKey={key}
                      content={({ x, y, index, value }) =>
                        index === last ? (
                          <text x={Number(x) + 8} y={Number(y) + 4} className="fill-foreground text-xs">
                            {`${fmt(Number(value))} m`}
                          </text>
                        ) : null
                      }
                    />
                  </Line>
                ))}
              </LineChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">{accuracyConfig.model.label}</TableHead>
                  <TableHead className="text-right">{accuracyConfig.baseline.label}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.day}>
                    <TableCell>{d.day}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.model)} mnt</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.baseline)} mnt</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
