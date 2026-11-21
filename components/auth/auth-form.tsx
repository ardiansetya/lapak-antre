"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { TriangleAlertIcon } from "lucide-react"

import { TextField } from "@/components/text-field"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldDescription, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { login, register } from "@/lib/actions"
import { applyServerErrors, clearServerErrorOnChange, fieldRule } from "@/lib/form"
import { rules } from "@/lib/validation"

const COPY = {
  login: {
    title: "Masuk ke dashboard",
    description: "Untuk pemilik usaha dan petugas loket.",
    submit: "Masuk",
    switchText: "Belum punya akun?",
    switchLabel: "Coba gratis",
    switchHref: "/daftar",
  },
  register: {
    title: "Buat akun usaha",
    description: "Gratis. Kami siapkan satu cabang, satu layanan, dan satu loket untuk Anda.",
    submit: "Buat akun",
    switchText: "Sudah punya akun?",
    switchLabel: "Masuk",
    switchHref: "/masuk",
  },
} as const

export function AuthForm({ mode, demo }: { mode: keyof typeof COPY; demo?: { email: string; password: string } }) {
  const copy = COPY[mode]
  const [formError, setFormError] = useState<string>()
  const form = useForm({
    defaultValues: { business: "", email: demo?.email ?? "", password: demo?.password ?? "" },
    listeners: clearServerErrorOnChange,
    onSubmit: async ({ value }) => {
      setFormError(undefined)
      // On success both actions redirect to the dashboard, so only failures return here.
      const result = mode === "login" ? await login(value) : await register(value)
      setFormError(result?.error)
      applyServerErrors(form, result?.fieldErrors)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold tracking-tight">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
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
            {mode === "register" && (
              <form.Field name="business" validators={fieldRule(rules.business)}>
                {(field) => <TextField field={field} label="Nama usaha" placeholder="Klinik Pratama Kasih Ibu" required />}
              </form.Field>
            )}
            <form.Field name="email" validators={fieldRule(rules.email)}>
              {(field) => <TextField field={field} label="Email" type="email" autoComplete="email" required />}
            </form.Field>
            <form.Field name="password" validators={fieldRule(mode === "login" ? rules.password : rules.newPassword)}>
              {(field) => (
                <TextField
                  field={field}
                  label="Kata sandi"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  description={mode === "register" ? "Minimal 8 karakter." : undefined}
                  required
                />
              )}
            </form.Field>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={submitting}>
                  {submitting && <Spinner data-icon="inline-start" />}
                  {copy.submit}
                </Button>
              )}
            </form.Subscribe>
            {demo && (
              <FieldDescription className="text-center">
                Akun demo sudah terisi: {demo.email} / {demo.password}
              </FieldDescription>
            )}
            <FieldDescription className="text-center">
              {copy.switchText} <Link href={copy.switchHref}>{copy.switchLabel}</Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
