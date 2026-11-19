"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"

export type ServiceOption = {
  id: string
  name: string
  description: string
  isOpen: boolean
  waiting: number
  estimate: string
}

export function TakeTicketForm({ services }: { services: ServiceOption[] }) {
  const router = useRouter()
  const [serviceId, setServiceId] = useState(() => services.find((s) => s.isOpen)?.id ?? "")
  const [nameError, setNameError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim()
    if (name.length < 2) {
      setNameError("Isi nama panggilan minimal 2 huruf supaya petugas bisa memanggil Anda.")
      return
    }
    setNameError(null)
    startTransition(async () => {
      // Mock: the real call becomes a server action that creates the ticket.
      await new Promise((r) => setTimeout(r, 600))
      toast.success("Nomor antrean berhasil diambil")
      router.push("/tiket/demo")
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Pilih layanan</FieldLegend>
          <RadioGroup value={serviceId} onValueChange={(v) => setServiceId(String(v))}>
            {services.map((s) => (
              <FieldLabel key={s.id} htmlFor={s.id}>
                <Field orientation="horizontal" data-disabled={!s.isOpen || undefined}>
                  <FieldContent>
                    <FieldTitle>
                      {s.name}
                      {!s.isOpen && <Badge variant="outline">Tutup</Badge>}
                    </FieldTitle>
                    <FieldDescription>
                      {s.isOpen ? `${s.waiting} orang menunggu, sekitar ${s.estimate}` : s.description}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={s.id} id={s.id} disabled={!s.isOpen} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>

        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor="name">Nama panggilan</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="given-name"
            placeholder="Contoh: Nurul"
            aria-invalid={nameError ? true : undefined}
          />
          {nameError ? (
            <FieldError>{nameError}</FieldError>
          ) : (
            <FieldDescription>Dipakai petugas saat memanggil Anda.</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Nomor WhatsApp (opsional)</FieldLabel>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xx" />
          <FieldDescription>Hanya untuk pengingat giliran. Dihapus otomatis setelah 30 hari.</FieldDescription>
        </Field>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending || !serviceId}>
          {pending && <Spinner data-icon="inline-start" />}
          Ambil nomor
        </Button>
      </FieldGroup>
    </form>
  )
}
