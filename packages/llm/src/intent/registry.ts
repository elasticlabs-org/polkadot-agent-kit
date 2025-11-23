import type { CompiledIntentSchema, IntentSchemaDefinition, IntentSchemaRegistry } from "./types"
import { compileIntentSchema } from "./schema-builder"
import { validateIntentSchema } from "./validator"

/**
 * Default implementation of IntentSchemaRegistry
 */
export class DefaultIntentSchemaRegistry implements IntentSchemaRegistry {
  public schemas: Map<string, CompiledIntentSchema> = new Map()

  /**
   * Register a new intent schema
   */
  register(schema: IntentSchemaDefinition): void {
    // Validate schema first
    const validation = validateIntentSchema(schema)
    if (!validation.valid) {
      throw new Error(
        `Invalid intent schema '${schema.name}': ${validation.errors.join(", ")}`
      )
    }

    // Compile and store the schema
    const compiled = compileIntentSchema(schema)
    this.schemas.set(schema.name, compiled)
  }

  /**
   * Get a registered schema by name
   */
  get(name: string): CompiledIntentSchema | undefined {
    return this.schemas.get(name)
  }

  /**
   * Check if a schema is registered
   */
  has(name: string): boolean {
    return this.schemas.has(name)
  }

  /**
   * Remove a schema from the registry
   */
  remove(name: string): boolean {
    return this.schemas.delete(name)
  }

  /**
   * List all registered schema names
   */
  list(): string[] {
    return Array.from(this.schemas.keys())
  }

  /**
   * Clear all schemas
   */
  clear(): void {
    this.schemas.clear()
  }

  /**
   * Get the number of registered schemas
   */
  size(): number {
    return this.schemas.size
  }
}

/**
 * Global intent schema registry instance
 */
let globalRegistry: IntentSchemaRegistry | null = null

/**
 * Get the global intent schema registry
 */
export function getGlobalRegistry(): IntentSchemaRegistry {
  if (!globalRegistry) {
    globalRegistry = new DefaultIntentSchemaRegistry()
  }
  return globalRegistry
}

/**
 * Set a custom global registry
 */
export function setGlobalRegistry(registry: IntentSchemaRegistry): void {
  globalRegistry = registry
}

/**
 * Register a schema in the global registry
 */
export function registerIntentSchema(schema: IntentSchemaDefinition): void {
  getGlobalRegistry().register(schema)
}

/**
 * Get a schema from the global registry
 */
export function getIntentSchema(name: string): CompiledIntentSchema | undefined {
  return getGlobalRegistry().get(name)
}

