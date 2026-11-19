"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Counter, Service } from "@/lib/queue"

export function ServicesManager({
  initialServices,
  counters,
}: {
  initialServices: Service[]
  counters: Counter[]
}) {
  const [services, setServices] = useState(initialServices)
  const [open, setOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function toggle(id: string, isOpen: boolean) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isOpen } : s)))
    const name = services.find((s) => s.id === id)?.name
    toast(`${name} ${isOpen ? "dibuka" : "ditutup"} untuk pengambilan nomor`)
  }

  function addService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const prefix = String(data.get("prefix") ?? "").trim().toUpperCase()
    const minutes = Number(data.get("minutes"))
    const next: Record<string, string> = {}
    if (name.length < 3) next.name = "Nama layanan minimal 3 huruf."
    if (!/^[A-Z]{1,3}$/.test(prefix)) next.prefix = "Gunakan 1-3 huruf, misalnya E."
    else if (services.some((s) => s.prefix === prefix)) next.prefix = `Huruf ${prefix} sudah dipakai layanan lain.`
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) next.minutes = "Isi antara 1 dan 240 menit."
    setErrors(next)
    if (Object.keys(next).length) return

    setServices((prev) => [
      ...prev,
      {
        id: `svc-${prefix.toLowerCase()}-${prev.length}`,
        name,
        prefix,
        description: "",
        isOpen: false,
        avgServiceMinutes: minutes,
        activeCounters: 0,
        notifyAhead: 3,
        dailyQuota: null,
      },
    ])
    setOpen(false)
    toast.success(`Layanan ${name} ditambahkan. Hubungkan ke loket lalu buka layanannya.`)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Layanan</CardTitle>
          <CardDescription>Pelanggan hanya bisa mengambil nomor untuk layanan yang sedang buka.</CardDescription>
          <CardAction>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors({}) }}>
              <DialogTrigger render={<Button size="sm" />}>
                <PlusIcon data-icon="inline-start" />
                Tambah layanan
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={addService} noValidate className="flex flex-col gap-6">
                  <DialogHeader>
                    <DialogTitle>Tambah layanan</DialogTitle>
                    <DialogDescription>Setiap layanan punya antrean dan huruf nomor sendiri.</DialogDescription>
                  </DialogHeader>
                  <FieldGroup>
                    <Field data-invalid={errors.name ? true : undefined}>
                      <FieldLabel htmlFor="svc-name">Nama layanan</FieldLabel>
                      <Input id="svc-name" name="name" placeholder="Poli Anak" aria-invalid={errors.name ? true : undefined} />
                      <FieldError>{errors.name}</FieldError>
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field data-invalid={errors.prefix ? true : undefined}>
                        <FieldLabel htmlFor="svc-prefix">Huruf nomor</FieldLabel>
                        <Input id="svc-prefix" name="prefix" maxLength={3} placeholder="E" className="uppercase" aria-invalid={errors.prefix ? true : undefined} />
                        {errors.prefix ? <FieldError>{errors.prefix}</FieldError> : <FieldDescription>Nomor jadi E-001.</FieldDescription>}
                      </Field>
                      <Field data-invalid={errors.minutes ? true : undefined}>
                        <FieldLabel htmlFor="svc-minutes">Lama layanan awal</FieldLabel>
                        <Input id="svc-minutes" name="minutes" type="number" inputMode="numeric" defaultValue={10} aria-invalid={errors.minutes ? true : undefined} />
                        {errors.minutes ? <FieldError>{errors.minutes}</FieldError> : <FieldDescription>Menit per pelanggan.</FieldDescription>}
                      </Field>
                    </div>
                  </FieldGroup>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" type="button" />}>Batal</DialogClose>
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <div className="overflow-x-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead className="text-right">Rata-rata layanan</TableHead>
                <TableHead className="text-right">Kuota harian</TableHead>
                <TableHead className="text-right">Kabari saat sisa</TableHead>
                <TableHead className="text-right">Buka</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <span className="mr-2 font-mono text-muted-foreground">{s.prefix}</span>
                    {s.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.avgServiceMinutes} mnt</TableCell>
                  <TableCell className="text-right tabular-nums">{s.dailyQuota ?? "Tanpa batas"}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.notifyAhead} orang</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={s.isOpen}
                      onCheckedChange={(v) => toggle(s.id, v)}
                      aria-label={`Buka layanan ${s.name}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loket</CardTitle>
          <CardDescription>Satu loket bisa melayani lebih dari satu layanan.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loket</TableHead>
                <TableHead>Melayani</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counters.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {c.serviceIds.map((id) => (
                      <Badge key={id} variant="outline">{services.find((s) => s.id === id)?.name}</Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={c.isActive ? "secondary" : "outline"}>{c.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
