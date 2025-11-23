import type {
  CompiledIntentSchema,
  FormattedIntentResponse,
  IntentFormatOptions
} from "./types"

/**
 * Format data according to an intent schema
 */
export function formatWithIntentSchema(
  data: unknown,
  schema: CompiledIntentSchema,
  options: IntentFormatOptions = {}
): FormattedIntentResponse {
  // Validate data against schema
  try {
    schema.zodSchema.parse(data)
  } catch (error) {
    throw new Error(
      `Data does not match intent schema '${schema.name}': ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Format the content using the schema's formatter
  let content = schema.formatter(data)

  // Add markdown formatting if requested
  if (options.includeMarkdown !== false) {
    // Content is already formatted as markdown by default
  }

  // Create response
  const response: FormattedIntentResponse = {
    content
  }

  // Add metadata if requested
  if (options.includeMetadata) {
    response.metadata = {
      schema: schema.name,
      layout: schema.layout,
      timestamp: new Date()
    }
  }

  return response
}

/**
 * Format a raw string response with an intent schema
 */
export function formatRawResponse(
  rawResponse: string,
  schema: CompiledIntentSchema,
  options: IntentFormatOptions = {}
): FormattedIntentResponse {
  // Try to parse the raw response as JSON
  try {
    const data = JSON.parse(rawResponse)
    return formatWithIntentSchema(data, schema, options)
  } catch {
    // If parsing fails, extract structured data from text
    const extracted = extractStructuredData(rawResponse, schema)
    return formatWithIntentSchema(extracted, schema, options)
  }
}

/**
 * Extract structured data from text using regex patterns
 */
function extractStructuredData(text: string, schema: CompiledIntentSchema): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // Try to extract key-value pairs from the text
  const lines = text.split("\n")

  for (const line of lines) {
    // Match patterns like "Key: Value" or "Key = Value"
    const match = line.match(/^([^:=]+)[:=]\s*(.+)$/)
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, "_")
      const value = match[2].trim()
      data[key] = value
    }
  }

  return data
}

/**
 * Format multiple responses with the same schema
 */
export function formatBatch(
  dataArray: unknown[],
  schema: CompiledIntentSchema,
  options: IntentFormatOptions = {}
): FormattedIntentResponse {
  const formattedItems = dataArray.map((data, index) => {
    try {
      const formatted = formatWithIntentSchema(data, schema, {
        ...options,
        includeMetadata: false
      })
      return formatted.content
    } catch (error) {
      return `Error formatting item ${index + 1}: ${error instanceof Error ? error.message : String(error)}`
    }
  })

  let content = `# Batch Results (${dataArray.length} items)\n\n`
  content += formattedItems.join("\n---\n\n")

  const response: FormattedIntentResponse = {
    content
  }

  if (options.includeMetadata) {
    response.metadata = {
      schema: schema.name,
      layout: schema.layout,
      timestamp: new Date()
    }
  }

  return response
}

/**
 * Create a preview of how data would look formatted
 */
export function previewFormat(data: unknown, schema: CompiledIntentSchema): string {
  try {
    const formatted = formatWithIntentSchema(data, schema, { includeMetadata: false })
    return formatted.content
  } catch (error) {
    return `Preview Error: ${error instanceof Error ? error.message : String(error)}`
  }
}

