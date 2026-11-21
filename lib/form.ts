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

/** Field validators from a lib/validation rule: checked when the field loses focus and on submit. */
export function fieldRule(rule: (value: string) => string | undefined) {
  const run = ({ value }: { value: string }) => rule(value)
  return { onBlur: run, onSubmit: run }
}

/** First error to show for a field: client rule or server check. */
export const firstError = (field: AnyFieldApi): string | undefined => field.state.meta.errors.find(Boolean)
