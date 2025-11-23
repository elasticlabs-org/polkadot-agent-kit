import type { IntentFieldDefinition, IntentSchemaDefinition } from "./types"

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate an intent schema definition
 */
export function validateIntentSchema(definition: IntentSchemaDefinition): ValidationResult {
  const errors: string[] = []

  // Validate name
  if (!definition.name || definition.name.trim().length === 0) {
    errors.push("Schema name is required")
  }

  // Validate layout
  const validLayouts = ["list", "grid", "cards", "table", "custom"]
  if (!validLayouts.includes(definition.layout)) {
    errors.push(`Invalid layout: ${definition.layout}. Must be one of: ${validLayouts.join(", ")}`)
  }

  // Validate fields
  if (!definition.fields || definition.fields.length === 0) {
    errors.push("Schema must have at least one field")
  } else {
    definition.fields.forEach((field, index) => {
      const fieldErrors = validateField(field, `field[${index}]`)
      errors.push(...fieldErrors)
    })
  }

  // Validate custom template if layout is custom
  if (definition.layout === "custom" && !definition.template) {
    errors.push("Custom layout requires a template")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate a field definition
 */
function validateField(field: IntentFieldDefinition, path: string): string[] {
  const errors: string[] = []

  // Validate name
  if (!field.name || field.name.trim().length === 0) {
    errors.push(`${path}: Field name is required`)
  }

  // Validate type
  const validTypes = ["string", "number", "boolean", "array", "object"]
  if (!validTypes.includes(field.type)) {
    errors.push(
      `${path}: Invalid type '${field.type}'. Must be one of: ${validTypes.join(", ")}`
    )
  }

  // Validate array items
  if (field.type === "array") {
    if (!field.items) {
      errors.push(`${path}: Array type requires 'items' definition`)
    } else {
      const itemErrors = validateField(field.items, `${path}.items`)
      errors.push(...itemErrors)
    }
  }

  // Validate object properties
  if (field.type === "object" && field.properties) {
    Object.entries(field.properties).forEach(([key, prop]) => {
      const propErrors = validateField(prop, `${path}.properties.${key}`)
      errors.push(...propErrors)
    })
  }

  // Validate format
  if (field.format) {
    const validFormats = ["email", "url", "date", "time", "datetime"]
    if (field.type === "string" && !validFormats.includes(field.format)) {
      errors.push(`${path}: Invalid format '${field.format}' for string type`)
    } else if (field.type !== "string") {
      errors.push(`${path}: Format can only be used with string type`)
    }
  }

  return errors
}

/**
 * Validate data against a field definition
 */
export function validateDataAgainstField(
  data: unknown,
  field: IntentFieldDefinition
): ValidationResult {
  const errors: string[] = []

  // Check required
  if (field.required && (data === null || data === undefined)) {
    errors.push(`Field '${field.name}' is required`)
    return { valid: false, errors }
  }

  // Skip validation if optional and not provided
  if (!field.required && (data === null || data === undefined)) {
    return { valid: true, errors: [] }
  }

  // Validate type
  switch (field.type) {
    case "string":
      if (typeof data !== "string") {
        errors.push(`Field '${field.name}' must be a string`)
      }
      break

    case "number":
      if (typeof data !== "number") {
        errors.push(`Field '${field.name}' must be a number`)
      }
      break

    case "boolean":
      if (typeof data !== "boolean") {
        errors.push(`Field '${field.name}' must be a boolean`)
      }
      break

    case "array":
      if (!Array.isArray(data)) {
        errors.push(`Field '${field.name}' must be an array`)
      } else if (field.items) {
        // Validate each item
        (data as unknown[]).forEach((item, index) => {
          const itemResult = validateDataAgainstField(item, {
            ...field.items!,
            name: `${field.name}[${index}]`
          })
          errors.push(...itemResult.errors)
        })
      }
      break

    case "object":
      if (typeof data !== "object" || Array.isArray(data)) {
        errors.push(`Field '${field.name}' must be an object`)
      } else if (field.properties) {
        const obj = data as Record<string, unknown>
        Object.entries(field.properties).forEach(([key, propDef]) => {
          const propResult = validateDataAgainstField(obj[key], propDef)
          errors.push(...propResult.errors)
        })
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate data against a full schema definition
 */
export function validateDataAgainstSchema(
  data: unknown,
  schema: IntentSchemaDefinition
): ValidationResult {
  const errors: string[] = []

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push("Data must be an object")
    return { valid: false, errors }
  }

  const obj = data as Record<string, unknown>

  schema.fields.forEach(field => {
    const result = validateDataAgainstField(obj[field.name], field)
    errors.push(...result.errors)
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

