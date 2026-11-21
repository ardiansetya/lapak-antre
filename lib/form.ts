import type { AnyFieldApi, AnyFormApi } from "@tanstack/react-form"

/** Shows errors only the server can find (duplicate prefix, taken email) under their fields. */
export function applyServerErrors(form: AnyFormApi, fieldErrors: Record<string, string> | undefined) {
  for (const [name, message] of Object.entries(fieldErrors ?? {}))
    form.setFieldMeta(name, (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: message } }))
}

/** Form listener: editing a field clears the server error it was showing. */
export const clearServerErrorOnChange = {
  onChange: ({ fieldApi }: { fieldApi: AnyFieldApi }) => {
    if (fieldApi.state.meta.errorMap.onServer)
      fieldApi.setMeta((meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }))
  },
}

/**
 * Awaits a server action and turns an unexpected failure (a 500) into a message the form can show,
 * instead of a button that silently does nothing. Redirects are framework control flow: rethrown.
 */
export async function orServerError<T>(action: Promise<T>): Promise<T | { error: string; fieldErrors?: undefined }> {
  try {
    return await action
  } catch (error) {
    if (String((error as { digest?: unknown })?.digest ?? "").startsWith("NEXT_REDIRECT")) throw error
    console.error(error)
    return { error: "Terjadi kesalahan di server. Coba lagi sebentar lagi." }
  }
}

/** Field validators from a lib/validation rule: checked when the field loses focus and on submit. */
export function fieldRule(rule: (value: string) => string | undefined) {
  const run = ({ value }: { value: string }) => rule(value)
  return { onBlur: run, onSubmit: run }
}

/** First error to show for a field: client rule or server check. */
export const firstError = (field: AnyFieldApi): string | undefined => field.state.meta.errors.find(Boolean)
