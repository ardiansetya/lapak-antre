"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { TriangleAlertIcon } from "lucide-react"

import { TextField } from "@/components/text-field"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { takeTicket } from "@/lib/actions"
import { applyServerErrors, clearServerErrorOnChange, fieldRule } from "@/lib/form"
import { rules } from "@/lib/validation"

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
  const [formError, setFormError] = useState<string>()
  const form = useForm({
    defaultValues: { serviceId: services.find((s) => s.isOpen)?.id ?? "", name: "", phone: "" },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      // On success the action redirects to the new ticket, so only failures return here.
      const result = await takeTicket({ ...value, branch: branchSlug, k: qrCode })
      setFormError(result?.error)
      applyServerErrors(form, result?.fieldErrors)
    },
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{formError}</AlertTitle>
          </Alert>
        )}
        <form.Field name="serviceId">
          {(field) => (
            <FieldSet>
              <FieldLegend>Pilih layanan</FieldLegend>
              <RadioGroup value={field.state.value} onValueChange={(v) => field.handleChange(String(v))}>
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
          )}
        </form.Field>

        <form.Field name="name" validators={fieldRule(rules.customerName)}>
          {(field) => (
            <TextField
              field={field}
              label="Nama panggilan"
              autoComplete="given-name"
              placeholder="Contoh: Nurul"
              maxLength={40}
              required
              description="Dipakai petugas saat memanggil Anda."
            />
          )}
        </form.Field>

        <form.Field name="phone" validators={fieldRule(rules.phone)}>
          {(field) => (
            <TextField
              field={field}
              label="Nomor WhatsApp (opsional)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08xx"
              description="Hanya untuk pengingat giliran. Dihapus otomatis setelah 30 hari."
            />
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.isSubmitting, s.values.serviceId] as const}>
          {([submitting, serviceId]) => (
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={submitting || !serviceId}>
              {submitting && <Spinner data-icon="inline-start" />}
              Ambil nomor
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  )
}
