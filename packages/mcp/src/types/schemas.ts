import { z } from "zod";

// Base schemas
export const chainSchema = z.enum(["polkadot", "kusama", "westend"]);
export const addressSchema = z.string().min(47).max(48);
export const amountSchema = z
  .string()
  .refine(
    (amount) => /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) > 0,
    "Amount must be a positive number",
  );

// Balance tool schemas
export const checkBalanceSchema = z.object({
  chain: chainSchema,
});

// Transfer tool schemas
export const transferNativeSchema = z.object({
  to: addressSchema,
  amount: amountSchema,
  chain: chainSchema,
});

// Staking tool schemas
export const bondTokensSchema = z.object({
  amount: amountSchema,
  payee: z.enum(["Staked", "Stash", "Controller"]),
  chain: chainSchema,
});

export const unbondTokensSchema = z.object({
  amount: amountSchema,
  chain: chainSchema,
});

export const claimRewardsSchema = z.object({
  chain: chainSchema,
});

export const joinNominationPoolSchema = z.object({
  poolId: z.number().positive(),
  amount: amountSchema,
  chain: chainSchema,
});

export const poolBondExtraSchema = z.object({
  amount: amountSchema,
  chain: chainSchema,
});

// XCM tool schemas - updated to match SDK interface
export const xcmTransferSchema = z.object({
  amount: amountSchema.describe("The amount of tokens to transfer"),
  to: addressSchema.describe("The address to transfer the tokens to"),
  sourceChain: z
    .enum([
      "polkadot",
      "kusama",
      "westend",
      "polkadot_asset_hub",
      "west_asset_hub",
      "hydra",
    ])
    .describe("The source chain to transfer from"),
  destChain: z
    .enum([
      "polkadot",
      "kusama",
      "westend",
      "polkadot_asset_hub",
      "west_asset_hub",
      "hydra",
    ])
    .describe("The destination chain to transfer to"),
});

// DeFi tool schemas - updated to match SDK interface
export const swapTokensSchema = z.object({
  from: z
    .string()
    .optional()
    .describe("Source chain for cross-chain swap (e.g., 'Polkadot', 'Hydra')"),
  to: z
    .string()
    .optional()
    .describe(
      "Destination chain for cross-chain swap (e.g., 'Polkadot', 'Hydra')",
    ),
  currencyFrom: z
    .string()
    .describe("Token symbol to swap from (e.g., 'DOT', 'KSM', 'HDX')"),
  currencyTo: z
    .string()
    .describe("Token symbol to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')"),
  amount: amountSchema.describe("Amount of source token to swap"),
  receiver: addressSchema
    .optional()
    .describe("Optional receiver address (defaults to sender)"),
  dex: z
    .string()
    .optional()
    .describe("DEX name for specific DEX swaps (e.g., 'HydrationDex')"),
});

// Nomination pools tool schemas
export const joinPoolSchema = z.object({
  amount: amountSchema,
  chain: chainSchema,
});

export const bondExtraSchema = z.object({
  type: z
    .enum(["FreeBalance", "Rewards"])
    .describe("Type of bonding operation"),
  amount: amountSchema
    .optional()
    .describe("Amount to bond (required for FreeBalance)"),
  chain: chainSchema,
});

export const unbondSchema = z.object({
  amount: amountSchema,
  chain: chainSchema,
});

export const withdrawUnbondedSchema = z.object({
  slashingSpans: z.string().describe("The number of slashing spans"),
  chain: chainSchema,
});

// Export types
export type CheckBalanceParams = z.infer<typeof checkBalanceSchema>;
export type TransferNativeParams = z.infer<typeof transferNativeSchema>;
export type BondTokensParams = z.infer<typeof bondTokensSchema>;
export type UnbondTokensParams = z.infer<typeof unbondTokensSchema>;
export type ClaimRewardsParams = z.infer<typeof claimRewardsSchema>;
export type JoinNominationPoolParams = z.infer<typeof joinNominationPoolSchema>;
export type PoolBondExtraParams = z.infer<typeof poolBondExtraSchema>;
export type XCMTransferParams = z.infer<typeof xcmTransferSchema>;
export type SwapTokensParams = z.infer<typeof swapTokensSchema>;

// Nomination pools types
export type JoinPoolParams = z.infer<typeof joinPoolSchema>;
export type BondExtraParams = z.infer<typeof bondExtraSchema>;
export type UnbondParams = z.infer<typeof unbondSchema>;
export type WithdrawUnbondedParams = z.infer<typeof withdrawUnbondedSchema>;

// XCM and swap types (using updated names for consistency)
export type XcmTransferParams = z.infer<typeof xcmTransferSchema>;
