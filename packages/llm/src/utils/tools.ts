import type { KnownChainId } from "@polkadot-agent-kit/common"
import { convertAddress } from "@polkadot-agent-kit/core"
import type { ZodType } from "zod"

import type { Action, ToolError, ToolResponse } from "../types"
import { ToolNames } from "../types"
import { ErrorCodes, InvalidAddressError, isAnyToolError } from "../types"

const generateToolCallId = (prefix: string): string => `${prefix}_${Date.now()}`

export const validateAndFormatAddress = (address: string, chain: KnownChainId): string => {
  const formattedAddress = convertAddress(address, chain)
  if (!formattedAddress) {
    throw new InvalidAddressError(address)
  }
  return formattedAddress
}

export const createErrorResponse = (error: ToolError | string, toolName: string): ToolResponse => {
  if (isAnyToolError(error)) {
    return {
      content: JSON.stringify({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          name: error.name,
          details: error.details
        },
        tool: toolName,
        timestamp: new Date().toISOString()
      }),
      tool_call_id: generateToolCallId(`${toolName}_error_${error.code}`)
    }
  }

  return {
    content: JSON.stringify({
      success: false,
      error: {
        code: ErrorCodes.LLM_INVALID_PARAMETERS,
        message: typeof error === "string" ? error : "Unknown error occurred",
        name: "GenericError"
      },
      tool: toolName,
      timestamp: new Date().toISOString()
    }),
    tool_call_id: generateToolCallId(`${toolName}_error`)
  }
}

export const createSuccessResponse = (data: unknown, toolName: string): ToolResponse => ({
  content: JSON.stringify({
    success: true,
    data,
    tool: toolName,
    timestamp: new Date().toISOString()
  }),
  tool_call_id: generateToolCallId(toolName)
})

export const executeTool = async <T>(
  toolName: string,
  operation: () => Promise<T>,
  successMessage?: (result: T) => string | T
): Promise<ToolResponse> => {
  try {
    const result = await operation()
    const data = successMessage ? successMessage(result) : result
    return createSuccessResponse(data, toolName)
  } catch (error) {
    if (isAnyToolError(error)) {
      return createErrorResponse(error, toolName)
    }

    // Convert unknown errors to ToolError format
    const toolError: ToolError = {
      name: error instanceof Error ? error.constructor.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: ErrorCodes.LLM_INVALID_PARAMETERS,
      details: error
    } as ToolError

    return createErrorResponse(toolError, toolName)
  }
}

export const createAction = <T>(
  tool: { invoke: (args: T) => Promise<unknown> },
  toolConfig: { name: string; description: string; schema: ZodType }
): Action => ({
  name: toolConfig.name,
  description: toolConfig.description,
  schema: toolConfig.schema,
  invoke: async (args: T) => {
    const result = await tool.invoke(args)
    return typeof result === "string" ? result : JSON.stringify(result)
  }
})

export function validateTools(actions: Action[], existingCustomActions: Action[]): void {
  const builtInToolNames = new Set(Object.values(ToolNames))

  for (const action of actions) {
    if (!action.name || typeof action.name !== "string") {
      throw new Error("Action must have a valid 'name' property")
    }

    if (!action.description || typeof action.description !== "string") {
      throw new Error(`Action '${action.name}' must have a valid 'description' property`)
    }

    if (!action.schema) {
      throw new Error(`Action '${action.name}' must have a valid 'schema' property`)
    }

    if (!action.invoke || typeof action.invoke !== "function") {
      throw new Error(`Action '${action.name}' must have a valid 'invoke' function`)
    }

    if (builtInToolNames.has(action.name as ToolNames)) {
      throw new Error(
        `Action name '${action.name}' conflicts with a built-in tool. Please use a different name.`
      )
    }

    if (existingCustomActions.some(existing => existing.name === action.name)) {
      throw new Error(
        `Action name '${action.name}' already exists in custom actions. Please use a unique name.`
      )
    }
  }
}
