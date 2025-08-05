import type { PolkadotMCPServerConfig } from '../types/index';

// export function loadConfigFromEnv(): Partial<PolkadotMCPServerConfig> {
//   return {
//     privateKey: process.env.PRIVATE_KEY || "",
//   };
// }

export function createDefaultConfig(): PolkadotMCPServerConfig {
  return {
    name: "polkadot-agent-kit",
    version: "1.0.0",
    privateKey: "0xa44c9dc5e2f5e6de16b2bce08020c3da92b92e4d240f1a3b17024c57f1b902a8"
  } as PolkadotMCPServerConfig;
} 