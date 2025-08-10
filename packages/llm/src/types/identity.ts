import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { ToolConfig } from "./common"
import { ToolNames } from "./common"

export const registerIdentitySchema = z.object({
  display: z.string().optional().describe("Display name for the identity"),
  legal: z.string().optional().describe("Legal name for the identity"),
  web: z.string().optional().describe("Website URL for the identity"),
  matrix: z.string().optional().describe("Matrix username for the identity"),
  email: z.string().optional().describe("Email address for the identity"),
  image: z.string().optional().describe("Image hash or URL for the identity"),
  twitter: z.string().optional().describe("Twitter handle for the identity"),
  github: z.string().optional().describe("GitHub username for the identity"),
  discord: z.string().optional().describe("Discord username for the identity")
})

export const toolConfigRegisterIdentity: ToolConfig = {
  name: ToolNames.REGISTER_IDENTITY,
  description: "Register an identity on People Chain",
  schema: registerIdentitySchema
}

export type RegisterIdentityTool = DynamicStructuredTool<typeof registerIdentitySchema>

export interface RegisterIdentityToolResult {
  /**
   * Indicates whether the transfer was successful.
   */
  success: boolean

  /**
   * The transaction hash if the transfer was submitted successfully.
   * This may be undefined if the transfer failed.
   */
  transactionHash?: string

  /**
   * An error message if the transfer failed.
   * This will be undefined if the transfer was successful.
   */
  error?: string
}
