"use client"

import { useActionState, useState, useTransition } from "react"
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
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addService, setServiceOpen, type FormState } from "@/lib/actions"

type ServiceRow = {
  id: string
  name: string
  prefix: string
  isOpen: boolean
  defaultMinutes: number
  dailyQuota: number | null
  notifyAhead: number
}
type CounterRow = { id: string; name: string; isActive: boolean; serviceIds: string[] }

function AddServiceDialog() {
  const [open, setOpen] = useState(false)
  // Wrap the action so a successful save (no state returned) closes the dialog.
  const [state, action, pending] = useActionState(async (prev: FormState, data: FormData) => {
    const result = await addService(prev, data)
    if (!result) {
      setOpen(false)
      toast.success("Layanan ditambahkan dan dilayani semua loket aktif.")
    }
    return result
  }, undefined)
  const errors = state?.fieldErrors ?? {}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        Tambah layanan
      </DialogTrigger>
      <DialogContent>
        <form action={action} noValidate className="flex flex-col gap-6">
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
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OpenSwitch({ service }: { service: ServiceRow }) {
  const [pending, startTransition] = useTransition()
  return (
    <Switch
      checked={service.isOpen}
      disabled={pending}
      aria-label={`Buka layanan ${service.name}`}
      onCheckedChange={(isOpen) =>
        startTransition(async () => {
          const result = await setServiceOpen(service.id, isOpen)
          if (result?.error) toast.error(result.error)
          else toast(`${service.name} ${isOpen ? "dibuka" : "ditutup"} untuk pengambilan nomor`)
        })
      }
    />
  )
}

export function ServicesManager({ services, counters }: { services: ServiceRow[]; counters: CounterRow[] }) {
  const serviceName = new Map(services.map((s) => [s.id, s.name]))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Layanan</CardTitle>
          <CardDescription>Pelanggan hanya bisa mengambil nomor untuk layanan yang sedang buka.</CardDescription>
          <CardAction>
            <AddServiceDialog />
          </CardAction>
        </CardHeader>
        <div className="overflow-x-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead className="text-right">Lama layanan awal</TableHead>
                <TableHead className="text-right">Kuota harian</TableHead>
                <TableHead className="text-right">Kabari saat sisa</TableHead>
                <TableHead className="text-right">Buka</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <span className="mr-2 rounded-[3px] bg-board px-1.5 py-0.5 font-mono text-xs text-board-foreground">{s.prefix}</span>
                    {s.name}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.defaultMinutes} mnt</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.dailyQuota ?? "Tanpa batas"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.notifyAhead} orang</TableCell>
                  <TableCell className="text-right">
                    <OpenSwitch service={s} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loket</CardTitle>
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
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.serviceIds.map((id) => (
                        <Badge key={id} variant="outline">
                          {serviceName.get(id)}
                        </Badge>
                      ))}
                    </div>
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
