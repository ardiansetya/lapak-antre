"use client"

import { useForm } from "@tanstack/react-form"
import { TicketPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { TextField } from "@/components/text-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createManualTicket } from "@/lib/actions"
import { applyServerErrors, clearServerErrorOnChange, fieldRule, orServerError } from "@/lib/form"
import { rules } from "@/lib/validation"

type ServiceChoice = { id: string; name: string; prefix: string; isOpen: boolean }

/** Issue a number for a walk-in without a phone (PRD Q-8). Staff read the number out loud. */
export function ManualTicket({ services }: { services: ServiceChoice[] }) {
  const open = services.filter((s) => s.isOpen)
  const form = useForm({
    defaultValues: { serviceId: open[0]?.id ?? "", name: "" },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      const result = await orServerError(createManualTicket(value))
      if (result && "code" in result) {
        toast.success(`Nomor ${result.code} untuk ${value.name.trim()}`, { description: "Sebutkan nomornya ke pelanggan." })
        form.reset({ serviceId: value.serviceId, name: "" })
        return
      }
      if (result?.error) toast.error(result.error)
      applyServerErrors(form, result?.fieldErrors)
    },
  })

  if (!open.length) return null

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketPlusIcon className="size-4" /> Tiket manual
        </CardTitle>
        <CardDescription>Untuk pelanggan tanpa HP. Nomornya ikut tampil di layar TV.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            {open.length > 1 && (
              <form.Field name="serviceId">
                {(field) => (
                  <ToggleGroup
                    variant="outline"
                    size="sm"
                    aria-label="Layanan"
                    value={[field.state.value]}
                    onValueChange={(v) => v[0] && field.handleChange(String(v[0]))}
                  >
                    {open.map((s) => (
                      <ToggleGroupItem key={s.id} value={s.id}>
                        <span className="font-mono">{s.prefix}</span> {s.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              </form.Field>
            )}
            <form.Field name="name" validators={fieldRule(rules.customerName)}>
              {(field) => <TextField field={field} label="Nama panggilan" placeholder="Contoh: Pak Budi" maxLength={40} />}
            </form.Field>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" variant="outline" disabled={submitting}>
                  {submitting && <Spinner data-icon="inline-start" />}
                  Buat nomor
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
