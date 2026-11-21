// Field rules shared by the client forms (TanStack Form validators) and the server actions.
// Each rule returns an error message, or undefined when the value is fine. Pure: node:test can run it.

type Rule = (value: string) => string | undefined

const lengthBetween = (min: number, max: number, message: string): Rule => (v) =>
  v.trim().length < min || v.trim().length > max ? message : undefined

export const rules = {
  customerName: lengthBetween(2, 40, "Isi nama panggilan 2-40 huruf supaya petugas bisa memanggil Anda."),
  phone: (v) => {
    const digits = v.replace(/[^\d+]/g, "")
    return digits && !/^\+?\d{9,15}$/.test(digits) ? "Nomor HP belum benar." : undefined
  },
  business: lengthBetween(3, 80, "Nama usaha 3-80 huruf."),
  email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? undefined : "Format email belum benar."),
  password: (v) => (v ? undefined : "Isi kata sandi."),
  newPassword: (v) => (v.length < 8 ? "Kata sandi minimal 8 karakter." : undefined),
  serviceName: lengthBetween(3, 60, "Nama layanan 3-60 huruf."),
  prefix: (v) => (/^[A-Z]{1,3}$/.test(v.trim().toUpperCase()) ? undefined : "Gunakan 1-3 huruf, misalnya E."),
  minutes: (v) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 1 && n <= 240 ? undefined : "Isi antara 1 dan 240 menit."
  },
} satisfies Record<string, Rule>

/** Runs the given rules over raw input. Returns field errors, or undefined when everything passes. */
export function validate<K extends string>(input: Record<NoInfer<K>, unknown>, checks: Record<K, Rule>) {
  const errors: Partial<Record<K, string>> = {}
  for (const key in checks) {
    const message = checks[key](String(input[key] ?? ""))
    if (message) errors[key] = message
  }
  return Object.keys(errors).length ? (errors as Record<string, string>) : undefined
}
