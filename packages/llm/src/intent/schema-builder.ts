import { z } from "zod"

import type { CompiledIntentSchema, IntentFieldDefinition, IntentSchemaDefinition } from "./types"

/**
 * Convert field definition to Zod schema
 */
function fieldToZodSchema(field: IntentFieldDefinition): z.ZodType {
  let schema: z.ZodType

  switch (field.type) {
    case "string":
      schema = z.string()
      if (field.format === "email") {
        schema = (schema as z.ZodString).email()
      } else if (field.format === "url") {
        schema = (schema as z.ZodString).url()
      }
      break

    case "number":
      schema = z.number()
      break

    case "boolean":
      schema = z.boolean()
      break

    case "array":
      if (field.items) {
        schema = z.array(fieldToZodSchema(field.items))
      } else {
        schema = z.array(z.unknown())
      }
      break

    case "object":
      if (field.properties) {
        const shape: Record<string, z.ZodType> = {}
        for (const [key, value] of Object.entries(field.properties)) {
          shape[key] = fieldToZodSchema(value)
        }
        schema = z.object(shape)
      } else {
        schema = z.record(z.unknown())
      }
      break

    default:
      schema = z.unknown()
  }

  // Add description if provided
  if (field.description) {
    schema = schema.describe(field.description)
  }

  // Make optional if not required
  if (!field.required) {
    schema = schema.optional()
  }

  // Add default value if provided
  if (field.default !== undefined) {
    schema = schema.default(field.default)
  }

  return schema
}

/**
 * Build Zod schema from intent schema definition
 */
export function buildZodSchema(definition: IntentSchemaDefinition): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodType> = {}

  for (const field of definition.fields) {
    shape[field.name] = fieldToZodSchema(field)
  }

  return z.object(shape)
}

/**
 * Create a formatter function based on layout type
 */
function createFormatter(definition: IntentSchemaDefinition): (data: unknown) => string {
  return (data: unknown) => {
    if (!data || typeof data !== "object") {
      return String(data)
    }

    const obj = data as Record<string, unknown>

    switch (definition.layout) {
      case "list":
        return formatAsList(obj, definition)

      case "grid":
        return formatAsGrid(obj, definition)

      case "cards":
        return formatAsCards(obj, definition)

      case "table":
        return formatAsTable(obj, definition)

      case "custom":
        if (definition.template) {
          return formatWithTemplate(obj, definition.template)
        }
        return JSON.stringify(obj, null, 2)

      default:
        return JSON.stringify(obj, null, 2)
    }
  }
}

/**
 * Format data as a list
 */
function formatAsList(data: Record<string, unknown>, definition: IntentSchemaDefinition): string {
  let output = `# ${definition.name}\n\n`

  if (definition.description) {
    output += `${definition.description}\n\n`
  }

  for (const field of definition.fields) {
    const value = data[field.name]
    if (value !== undefined) {
      output += `- **${field.name}**: ${formatValue(value)}\n`
    }
  }

  return output
}

/**
 * Format data as a grid
 */
function formatAsGrid(data: Record<string, unknown>, definition: IntentSchemaDefinition): string {
  let output = `# ${definition.name}\n\n`

  if (definition.description) {
    output += `${definition.description}\n\n`
  }

  const columns = 2
  const fields = definition.fields.map(f => ({ name: f.name, value: data[f.name] }))

  for (let i = 0; i < fields.length; i += columns) {
    const row = fields.slice(i, i + columns)
    output += row.map(f => `**${f.name}**: ${formatValue(f.value)}`).join(" | ")
    output += "\n\n"
  }

  return output
}

/**
 * Format data as cards
 */
function formatAsCards(data: Record<string, unknown>, definition: IntentSchemaDefinition): string {
  let output = `# ${definition.name}\n\n`

  if (definition.description) {
    output += `${definition.description}\n\n`
  }

  output += "```\n"
  output += "┌" + "─".repeat(50) + "┐\n"

  for (const field of definition.fields) {
    const value = data[field.name]
    if (value !== undefined) {
      const line = `│ ${field.name}: ${formatValue(value, 45)}`
      output += line + " ".repeat(52 - line.length) + "│\n"
    }
  }

  output += "└" + "─".repeat(50) + "┘\n"
  output += "```\n"

  return output
}

/**
 * Format data as a table
 */
function formatAsTable(data: Record<string, unknown>, definition: IntentSchemaDefinition): string {
  let output = `# ${definition.name}\n\n`

  if (definition.description) {
    output += `${definition.description}\n\n`
  }

  output += "| Field | Value |\n"
  output += "|-------|-------|\n"

  for (const field of definition.fields) {
    const value = data[field.name]
    if (value !== undefined) {
      output += `| ${field.name} | ${formatValue(value)} |\n`
    }
  }

  return output
}

/**
 * Format data using a custom template
 */
function formatWithTemplate(data: Record<string, unknown>, template: string): string {
  let output = template

  // Replace {{field}} placeholders
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g")
    output = output.replace(placeholder, formatValue(value))
  }

  return output
}

/**
 * Format a value for display
 */
function formatValue(value: unknown, maxLength?: number): string {
  if (value === null || value === undefined) {
    return "N/A"
  }

  if (Array.isArray(value)) {
    return value.map(v => formatValue(v)).join(", ")
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  // At this point, value is a primitive (string, number, boolean, bigint, symbol)
  let str: string
  if (typeof value === "string") {
    str = value
  } else if (typeof value === "number") {
    str = value.toString()
  } else if (typeof value === "boolean") {
    str = value.toString()
  } else if (typeof value === "bigint") {
    str = value.toString()
  } else {
    // Handle symbol or any other primitive type
    str = JSON.stringify(value)
  }

  if (maxLength && str.length > maxLength) {
    str = str.substring(0, maxLength - 3) + "..."
  }

  return str
}

/**
 * Compile an intent schema definition into a usable schema
 */
export function compileIntentSchema(definition: IntentSchemaDefinition): CompiledIntentSchema {
  return {
    name: definition.name,
    description: definition.description,
    layout: definition.layout,
    zodSchema: buildZodSchema(definition),
    template: definition.template,
    formatter: createFormatter(definition)
  }
}

/**
 * Create a simple intent schema builder
 */
export class IntentSchemaBuilder {
  private definition: Partial<IntentSchemaDefinition> = {
    fields: []
  }

  setName(name: string): this {
    this.definition.name = name
    return this
  }

  setDescription(description: string): this {
    this.definition.description = description
    return this
  }

  setLayout(layout: IntentSchemaDefinition["layout"]): this {
    this.definition.layout = layout
    return this
  }

  setTemplate(template: string): this {
    this.definition.template = template
    return this
  }

  addField(field: IntentFieldDefinition): this {
    this.definition.fields = this.definition.fields || []
    this.definition.fields.push(field)
    return this
  }

  addStringField(name: string, required = false, description?: string): this {
    return this.addField({ name, type: "string", required, description })
  }

  addNumberField(name: string, required = false, description?: string): this {
    return this.addField({ name, type: "number", required, description })
  }

  addBooleanField(name: string, required = false, description?: string): this {
    return this.addField({ name, type: "boolean", required, description })
  }

  addArrayField(name: string, items: IntentFieldDefinition, required = false): this {
    return this.addField({ name, type: "array", items, required })
  }

  addObjectField(
    name: string,
    properties: Record<string, IntentFieldDefinition>,
    required = false
  ): this {
    return this.addField({ name, type: "object", properties, required })
  }

  build(): IntentSchemaDefinition {
    if (!this.definition.name) {
      throw new Error("Intent schema name is required")
    }

    if (!this.definition.layout) {
      throw new Error("Intent schema layout is required")
    }

    if (!this.definition.fields || this.definition.fields.length === 0) {
      throw new Error("Intent schema must have at least one field")
    }

    return this.definition as IntentSchemaDefinition
  }

  buildCompiled(): CompiledIntentSchema {
    return compileIntentSchema(this.build())
  }
}

/**
 * Create a new intent schema builder
 */
export function createIntentSchemaBuilder(): IntentSchemaBuilder {
  return new IntentSchemaBuilder()
}
