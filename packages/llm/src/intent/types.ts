import type { z } from "zod"

/**
 * Intent suggestion layout types
 */
export type IntentLayoutType = "list" | "grid" | "cards" | "table" | "custom"

/**
 * Field definition for intent schema
 */
export interface IntentFieldDefinition {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  description?: string
  required?: boolean
  default?: unknown
  format?: string
  items?: IntentFieldDefinition
  properties?: Record<string, IntentFieldDefinition>
}

/**
 * Intent schema definition
 */
export interface IntentSchemaDefinition {
  name: string
  description?: string
  layout: IntentLayoutType
  fields: IntentFieldDefinition[]
  template?: string
  examples?: unknown[]
}

/**
 * Compiled intent schema
 */
export interface CompiledIntentSchema {
  name: string
  description?: string
  layout: IntentLayoutType
  zodSchema: z.ZodType
  template?: string
  formatter: (data: unknown) => string
}

/**
 * Intent response format options
 */
export interface IntentFormatOptions {
  includeMarkdown?: boolean
  includeMetadata?: boolean
  compact?: boolean
}

/**
 * Formatted intent response
 */
export interface FormattedIntentResponse {
  content: string
  metadata?: {
    schema: string
    layout: IntentLayoutType
    timestamp: Date
  }
}

/**
 * Intent schema registry
 */
export interface IntentSchemaRegistry {
  schemas: Map<string, CompiledIntentSchema>
  register(schema: IntentSchemaDefinition): void
  get(name: string): CompiledIntentSchema | undefined
  has(name: string): boolean
  remove(name: string): boolean
  list(): string[]
}

