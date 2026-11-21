"use client"

import { useActionState, useState } from "react"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"
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
import { takeTicket } from "@/lib/actions"

export type ServiceOption = {
  id: string
  name: string
  description: string
  isOpen: boolean
  waiting: number
  estimate: string
}

export function TakeTicketForm({
  services,
  branchSlug,
  qrCode,
}: {
  services: ServiceOption[]
  branchSlug: string
  qrCode: string
}) {
  const [state, action, pending] = useActionState(takeTicket, undefined)
  const [serviceId, setServiceId] = useState(() => services.find((s) => s.isOpen)?.id ?? "")
  const errors = state?.fieldErrors ?? {}

  return (
    <form action={action} noValidate>
      <input type="hidden" name="branch" value={branchSlug} />
      <input type="hidden" name="k" value={qrCode} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <FieldGroup>
        {state?.error && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{state.error}</AlertTitle>
          </Alert>
        )}
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
                      {s.isOpen
                        ? s.waiting
                          ? `${s.waiting} orang menunggu, sekitar ${s.estimate}`
                          : "Tidak ada antrean, langsung dilayani"
                        : s.description}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={s.id} id={s.id} disabled={!s.isOpen} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>

        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="name">Nama panggilan</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="given-name"
            placeholder="Contoh: Nurul"
            maxLength={40}
            required
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name ? <FieldError>{errors.name}</FieldError> : <FieldDescription>Dipakai petugas saat memanggil Anda.</FieldDescription>}
        </Field>

        <Field data-invalid={errors.phone ? true : undefined}>
          <FieldLabel htmlFor="phone">Nomor WhatsApp (opsional)</FieldLabel>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xx" aria-invalid={errors.phone ? true : undefined} />
          {errors.phone ? (
            <FieldError>{errors.phone}</FieldError>
          ) : (
            <FieldDescription>Hanya untuk pengingat giliran. Dihapus otomatis setelah 30 hari.</FieldDescription>
          )}
        </Field>

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending || !serviceId}>
          {pending && <Spinner data-icon="inline-start" />}
          Ambil nomor
        </Button>
      </FieldGroup>
    </form>
  )
}
