import { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { convertAddress, toMultiAddress } from "@polkadot-agent-kit/core"
import { MultiAddress } from "@polkadot-api/descriptors"
import { ToolResponse, ChainNotAvailableError, InvalidAddressError, ToolError, ErrorCodes, isAnyToolError } from "../types"

/**
 * Internal utility to generate unique IDs for tool responses.
 * Used by createErrorResponse and createSuccessResponse to generate
 * tool_call_id values in the format: `${prefix}_${timestamp}`
 */
const generateToolCallId = (prefix: string): string => `${prefix}_${Date.now()}`

export const getApiForChain = (
  apis: Map<KnownChainId, Api<KnownChainId>>,
  chain: string
): Api<KnownChainId> => {
  const api = apis.get(chain as KnownChainId)
  if (!api) {
    const availableChains = Array.from(apis.keys())
    throw new ChainNotAvailableError(chain, availableChains)
  }
  return api
}

export const validateAndFormatAddress = (address: string, chain: KnownChainId): string => {
  const formattedAddress = convertAddress(address, chain)
  if (!formattedAddress) {
    throw new InvalidAddressError(address)
  }
  return formattedAddress
}

export const validateAndFormatMultiAddress = (
  address: string,
  chain: KnownChainId
): MultiAddress => {
  const formattedAddress = validateAndFormatAddress(address, chain)
  return toMultiAddress(formattedAddress)
}

/**
 * Creates a standardized error response for tool operations.
 * Supports both ToolError objects and plain error messages.
 * 
 * @param error - ToolError object or error message string
 * @param toolName - Name of the tool that generated the error
 * @returns Structured tool response with error details
 * 
 * @example
 * ```typescript
 * // With ToolError object
 * const chainError = new ChainNotAvailableError("invalid", ["polkadot"]);
 * const response = createErrorResponse(chainError, "check_balance");
 * 
 * // With plain message (backward compatibility)
 * const response = createErrorResponse("Something went wrong", "transfer");
 * ```
 */
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
        message: typeof error === 'string' ? error : 'Unknown error occurred',
        name: 'GenericError'
      },
      tool: toolName,
      timestamp: new Date().toISOString()
    }),
    tool_call_id: generateToolCallId(`${toolName}_error`)
  }
}

/**
 * Creates a standardized success response for tool operations.
 * 
 * @param data - Success data or message
 * @param toolName - Name of the tool that generated the response
 * @returns Structured tool response with success data
 * 
 * @example
 * ```typescript
 * const response = createSuccessResponse({ balance: "100 DOT" }, "check_balance");
 * ```
 */
export const createSuccessResponse = (data: unknown, toolName: string): ToolResponse => ({
  content: JSON.stringify({
    success: true,
    data,
    tool: toolName,
    timestamp: new Date().toISOString()
  }),
  tool_call_id: generateToolCallId(toolName)
})

/**
 * Enhanced tool execution wrapper with structured error handling.
 * Automatically converts thrown errors to structured error responses.
 * 
 * @param toolName - Name of the tool being executed
 * @param operation - Async operation to execute
 * @param successMessage - Function to format success data
 * @returns Promise resolving to structured tool response
 * 
 * @example
 * ```typescript
 * const response = await executeTool(
 *   "check_balance",
 *   async () => {
 *     const balance = await getBalance(address, chain);
 *     return { balance, symbol: "DOT", chain };
 *   },
 *   (result) => `Balance: ${result.balance} ${result.symbol}`
 * );
 * ```
 */
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
      name: error instanceof Error ? error.constructor.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      code: ErrorCodes.LLM_INVALID_PARAMETERS,
      details: error
    } as ToolError
    
    return createErrorResponse(toolError, toolName)
  }
}

/**
 * Utility function to create chain-specific error responses.
 * 
 * @example
 * ```typescript
 * const response = createChainErrorResponse("invalid-chain", ["polkadot"], "check_balance");
 * ```
 */
export const createChainErrorResponse = (
  chain: string, 
  availableChains: string[], 
  toolName: string
): ToolResponse => {
  const error = new ChainNotAvailableError(chain, availableChains)
  return createErrorResponse(error, toolName)
}

/**
 * Utility function to create address-specific error responses.
 * 
 * @example
 * ```typescript
 * const response = createAddressErrorResponse("invalid-address", "transfer");
 * ```
 */
export const createAddressErrorResponse = (
  address: string, 
  toolName: string
): ToolResponse => {
  const error = new InvalidAddressError(address)
  return createErrorResponse(error, toolName)
}
