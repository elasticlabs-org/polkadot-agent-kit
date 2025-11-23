import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk"

import { PolkadotElizaAdapter } from "./adapter"
import type { ElizaPlugin, PolkadotElizaPluginConfig } from "./types"

/**
 * Create a Polkadot Agent Kit plugin for Eliza
 *
 * @param config - Plugin configuration
 * @returns Eliza plugin object
 *
 * @example
 * ```typescript
 * import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
 * import { createPolkadotPlugin } from "@polkadot-agent-kit/eliza";
 *
 * const agentKit = new PolkadotAgentKit({
 *   privateKey: "your-private-key",
 *   chains: ["polkadot", "kusama"]
 * });
 *
 * await agentKit.initializeApi();
 *
 * const plugin = createPolkadotPlugin({
 *   agentKit,
 *   enabledActions: ["check_balance", "transfer_native"]
 * });
 *
 * // Register with Eliza runtime
 * runtime.registerPlugin(plugin);
 * ```
 */
export function createPolkadotPlugin(config: PolkadotElizaPluginConfig): ElizaPlugin {
  const adapter = new PolkadotElizaAdapter(config.agentKit)
  let actions = adapter.getElizaActions()

  // Filter actions if specific ones are enabled
  if (config.enabledActions && config.enabledActions.length > 0) {
    actions = actions.filter(action => config.enabledActions!.includes(action.name))
  }

  return {
    name: "polkadot-agent-kit",
    description:
      "Polkadot blockchain operations including balance checks, transfers, XCM, staking, and DeFi",
    actions,
    evaluators: [],
    providers: [],
    services: []
  }
}

/**
 * Create a simplified Polkadot plugin with just the agent kit
 *
 * @param agentKit - The PolkadotAgentKit instance
 * @returns Eliza plugin object
 *
 * @example
 * ```typescript
 * import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
 * import { polkadotPlugin } from "@polkadot-agent-kit/eliza";
 *
 * const agentKit = new PolkadotAgentKit({
 *   privateKey: "your-private-key",
 *   chains: ["polkadot"]
 * });
 *
 * await agentKit.initializeApi();
 * const plugin = polkadotPlugin(agentKit);
 * ```
 */
export function polkadotPlugin(agentKit: PolkadotAgentKit): ElizaPlugin {
  return createPolkadotPlugin({ agentKit })
}

