import type { TemplateField } from "@/lib/channels/base"
import { getNestedValue } from "@/lib/utils"

export function getInitialTemplateFieldValues(rule: string, fields: TemplateField[]) {
  const values: Record<string, any> = {}

  try {
    const ruleObj = JSON.parse(rule || "{}")
    fields.forEach((field) => {
      if (field.component === "hidden" && field.defaultValue !== undefined) {
        values[field.key] = field.defaultValue
        return
      }

      const value = getNestedValue(ruleObj, field.key)
      if (value !== undefined) {
        values[field.key] = value
      }
    })
  } catch {
    fields.forEach((field) => {
      if (field.component === "hidden" && field.defaultValue !== undefined) {
        values[field.key] = field.defaultValue
      }
    })
  }

  return values
}

export function getSwitchedTemplateFieldValues(
  currentValues: Record<string, any>,
  fields: TemplateField[]
) {
  const values: Record<string, any> = {}

  fields.forEach((field) => {
    if (field.component === "hidden" && field.defaultValue !== undefined) {
      values[field.key] = field.defaultValue
      return
    }

    if (currentValues[field.key] !== undefined) {
      values[field.key] = currentValues[field.key]
    }
  })

  return values
}
