import type { Metadata } from "next"

import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Masuk" }

// Portfolio demo account created by `npm run db:seed`.
const DEMO = { email: "demo@lapakantre.test", password: "demo12345" }

export default function LoginPage() {
  return <AuthForm mode="login" demo={DEMO} />
}
