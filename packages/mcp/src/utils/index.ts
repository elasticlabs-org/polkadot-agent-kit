import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { MCPError, MCPErrorType } from "../types/index.js";

export function formatErrorResponse(error: Error): CallToolResult {
  if (error instanceof MCPError) {
    return {
      content: [
        {
          type: "text",
          text: `Error (${error.type}): ${error.message}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Unexpected error: ${error.message}`,
      },
    ],
    isError: true,
  };
}

export function formatSuccessResponse(message: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}

export async function executeTool<T>(
  toolName: string,
  operation: () => Promise<T>,
  formatter: (result: T) => string,
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return formatSuccessResponse(formatter(result));
  } catch (error) {
    return formatErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

export function validateAndFormatAddress(
  address: string,
  chain: string,
): string {
  // Basic validation - in a real implementation, you'd use proper address validation
  if (!address || address.length < 47 || address.length > 48) {
    throw new MCPError(
      MCPErrorType.INVALID_ADDRESS,
      `Invalid address format for chain ${chain}`,
    );
  }
  return address;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export * from "./config";
