"use client"

import type { AnyFieldApi } from "@tanstack/react-form"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { firstError } from "@/lib/form"

/** A TanStack Form field rendered as a labelled shadcn Input with its error or hint underneath. */
export function TextField({
  field,
  label,
  description,
  ...inputProps
}: { field: AnyFieldApi; label: string; description?: string } & Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "onBlur" | "name"
>) {
  const error = firstError(field)
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
      {error ? <FieldError>{error}</FieldError> : description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}
