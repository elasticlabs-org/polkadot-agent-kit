import type { Action } from "@polkadot-agent-kit/llm"
import { ToolNames } from "@polkadot-agent-kit/llm"

export function validateCustomTools(actions: Action[], existingCustomActions: Action[]): void {
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
