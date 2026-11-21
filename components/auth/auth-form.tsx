"use client"

import { useActionState } from "react"
import Link from "next/link"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { login, register } from "@/lib/actions"

const COPY = {
  login: {
    action: login,
    title: "Masuk ke dashboard",
    description: "Untuk pemilik usaha dan petugas loket.",
    submit: "Masuk",
    switchText: "Belum punya akun?",
    switchLabel: "Coba gratis",
    switchHref: "/daftar",
  },
  register: {
    action: register,
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
  const [state, action, pending] = useActionState(copy.action, undefined)
  const errors = state?.fieldErrors ?? {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold tracking-tight">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} noValidate>
          <FieldGroup>
            {state?.error && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{state.error}</AlertTitle>
              </Alert>
            )}
            {mode === "register" && (
              <Field data-invalid={errors.business ? true : undefined}>
                <FieldLabel htmlFor="business">Nama usaha</FieldLabel>
                <Input id="business" name="business" placeholder="Klinik Pratama Kasih Ibu" required aria-invalid={errors.business ? true : undefined} />
                <FieldError>{errors.business}</FieldError>
              </Field>
            )}
            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={demo?.email}
                aria-invalid={errors.email ? true : undefined}
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field data-invalid={errors.password ? true : undefined}>
              <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                defaultValue={demo?.password}
                aria-invalid={errors.password ? true : undefined}
              />
              {errors.password ? (
                <FieldError>{errors.password}</FieldError>
              ) : (
                mode === "register" && <FieldDescription>Minimal 8 karakter.</FieldDescription>
              )}
            </Field>
            <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {copy.submit}
            </Button>
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
