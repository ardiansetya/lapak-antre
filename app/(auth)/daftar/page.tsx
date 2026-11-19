import type { Metadata } from "next"

import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Coba gratis",
  description: "Buat akun Lapak Antre untuk klinik atau usaha Anda. Gratis selama masa pilot.",
}

export default function RegisterPage() {
  return <AuthForm mode="register" />
}
