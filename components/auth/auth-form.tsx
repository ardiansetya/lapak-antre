"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

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
    description: "Gratis selama masa pilot. Tidak perlu kartu kredit.",
    submit: "Buat akun",
    switchText: "Sudah punya akun?",
    switchLabel: "Masuk",
    switchHref: "/masuk",
  },
} as const

export function AuthForm({ mode }: { mode: keyof typeof COPY }) {
  const copy = COPY[mode]
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next: Record<string, string> = {}
    if (mode === "register" && String(data.get("business") ?? "").trim().length < 3)
      next.business = "Isi nama usaha minimal 3 huruf."
    if (!/^\S+@\S+\.\S+$/.test(String(data.get("email") ?? ""))) next.email = "Format email belum benar."
    if (String(data.get("password") ?? "").length < 8) next.password = "Kata sandi minimal 8 karakter."
    setErrors(next)
    if (Object.keys(next).length) return
    startTransition(async () => {
      // Mock: replaced by the auth library in M0.
      await new Promise((r) => setTimeout(r, 600))
      router.push("/dashboard")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {mode === "register" && (
              <Field data-invalid={errors.business ? true : undefined}>
                <FieldLabel htmlFor="business">Nama usaha</FieldLabel>
                <Input id="business" name="business" placeholder="Klinik Pratama Kasih Ibu" aria-invalid={errors.business ? true : undefined} />
                <FieldError>{errors.business}</FieldError>
              </Field>
            )}
            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={errors.email ? true : undefined} />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field data-invalid={errors.password ? true : undefined}>
              <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={errors.password ? true : undefined}
              />
              {errors.password ? (
                <FieldError>{errors.password}</FieldError>
              ) : (
                mode === "register" && <FieldDescription>Minimal 8 karakter.</FieldDescription>
              )}
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {copy.submit}
            </Button>
            <FieldDescription className="text-center">
              {copy.switchText} <Link href={copy.switchHref}>{copy.switchLabel}</Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
