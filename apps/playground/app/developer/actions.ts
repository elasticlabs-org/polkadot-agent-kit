"use server"

import { getOrCreateAgentKit } from '@/lib/agent-manager'

export interface ToolInfo {
  name: string
  description: string
  schemaJson: any
}

export interface ToolsMapResult {
  success: boolean
  tools?: Record<string, Record<string, ToolInfo>>
  error?: string
}

export async function getToolsMap(): Promise<ToolsMapResult> {
  try {
    const { agentKit } = await getOrCreateAgentKit()
    if (!agentKit) {
      return {
        success: false,
        error: 'Agent not initialized. Please configure your agent first.',
      }
    }

    const { default: zodToJsonSchema } = await import('zod-to-json-schema')

    const tools: Record<string, Record<string, ToolInfo>> = {
      assets: {
        getNativeBalanceTool: {
          name: 'getNativeBalanceTool',
          description: 'Get native balance tool',
          schemaJson: null,
        },
        transferNativeTool: {
          name: 'transferNativeTool',
          description: 'Transfer native tool',
          schemaJson: null,
        },
        xcmTransferNativeTool: {
          name: 'xcmTransferNativeTool',
          description: 'XCM transfer native tool',
          schemaJson: null,
        },
      },
      swap: {
        swapTokensTool: {
          name: 'swapTokensTool',
          description: 'Swap tokens tool',
          schemaJson: null,
        },
      },
      bifrost: {
        mintVdotTool: {
          name: 'mintVdotTool',
          description: 'Mint vDOT tool',
          schemaJson: null,
        },
      },
      staking: {
        joinPoolTool: {
          name: 'joinPoolTool',
          description: 'Join pool tool',
          schemaJson: null,
        },
        bondExtraTool: {
          name: 'bondExtraTool',
          description: 'Bond extra tool',
          schemaJson: null,
        },
        unbondTool: {
          name: 'unbondTool',
          description: 'Unbond tool',
          schemaJson: null,
        },
        withdrawUnbondedTool: {
          name: 'withdrawUnbondedTool',
          description: 'Withdraw unbonded tool',
          schemaJson: null,
        },
        claimRewardsTool: {
          name: 'claimRewardsTool',
          description: 'Claim rewards tool',
          schemaJson: null,
        },
      },
    }

    // Get actual tools from agentKit and process schemas
    const toolGetters: Record<string, Record<string, () => any>> = {
      assets: {
        getNativeBalanceTool: () => agentKit.getNativeBalanceTool(),
        transferNativeTool: () => agentKit.transferNativeTool(),
        xcmTransferNativeTool: () => agentKit.xcmTransferNativeTool(),
      },
      swap: {
        swapTokensTool: () => agentKit.swapTokensTool(),
      },
      bifrost: {
        mintVdotTool: () => agentKit.mintVdotTool(),
      },
      staking: {
        joinPoolTool: () => agentKit.joinPoolTool(),
        bondExtraTool: () => agentKit.bondExtraTool(),
        unbondTool: () => agentKit.unbondTool(),
        withdrawUnbondedTool: () => agentKit.withdrawUnbondedTool(),
        claimRewardsTool: () => agentKit.claimRewardsTool(),
      },
    }

    for (const [endpoint, endpointTools] of Object.entries(toolGetters)) {
      for (const [methodName, getTool] of Object.entries(endpointTools)) {
        try {
          const tool = getTool()
          const fullSchema = zodToJsonSchema(tool.schema, methodName) as any
          let schemaJson

          if (fullSchema?.$ref && fullSchema?.definitions) {
            const refName = fullSchema.$ref.replace('#/definitions/', '')
            schemaJson = fullSchema.definitions[refName] || fullSchema
          } else {
            schemaJson = fullSchema
          }

          tools[endpoint][methodName] = {
            name: methodName,
            description: tool.description || `${methodName} tool`,
            schemaJson,
          }
        } catch (error) {
          console.warn(`Failed to process schema for ${methodName}:`, error)
        }
      }
    }

    return {
      success: true,
      tools,
    }
  } catch (error) {
    console.error('[Developer Actions] Error getting tools map:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get tools map',
    }
  }
}

export interface ExecuteToolResult {
  success: boolean
  result?: any
  error?: string
}

export async function executeTool(
  endpoint: string,
  method: string,
  params: Record<string, any>
): Promise<ExecuteToolResult> {
  try {
    const { agentKit } = await getOrCreateAgentKit()
    if (!agentKit) {
      return {
        success: false,
        error: 'Agent not initialized. Please configure your agent first.',
      }
    }

    const toolGetters: Record<string, Record<string, () => any>> = {
      assets: {
        getNativeBalanceTool: () => agentKit.getNativeBalanceTool(),
        transferNativeTool: () => agentKit.transferNativeTool(),
        xcmTransferNativeTool: () => agentKit.xcmTransferNativeTool(),
      },
      swap: {
        swapTokensTool: () => agentKit.swapTokensTool(),
      },
      bifrost: {
        mintVdotTool: () => agentKit.mintVdotTool(),
      },
      staking: {
        joinPoolTool: () => agentKit.joinPoolTool(),
        bondExtraTool: () => agentKit.bondExtraTool(),
        unbondTool: () => agentKit.unbondTool(),
        withdrawUnbondedTool: () => agentKit.withdrawUnbondedTool(),
        claimRewardsTool: () => agentKit.claimRewardsTool(),
      },
    }

    const toolGetter = toolGetters[endpoint]?.[method]
    if (!toolGetter) {
      return {
        success: false,
        error: `Tool ${endpoint}.${method} not found`,
      }
    }

    const tool = toolGetter()
    const result = await tool.call(params)

    return {
      success: true,
      result,
    }
  } catch (error) {
    console.error('[Developer Actions] Error executing tool:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to execute tool',
    }
  }
}

