import { z } from 'zod';

// Base schemas
export const chainSchema = z.enum(["polkadot", "kusama", "westend"]);
export const addressSchema = z.string().min(47).max(48);
export const amountSchema = z.string().refine(
  (amount) => /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) > 0,
  "Amount must be a positive number"
);

// Balance tool schemas
export const checkBalanceSchema = z.object({
  chain: chainSchema
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

// XCM tool schemas
export const xcmTransferSchema = z.object({
  to: addressSchema,
  amount: amountSchema,
  fromChain: chainSchema,
  toChain: chainSchema,
  asset: z.string().optional(),
});

// DeFi tool schemas
export const swapTokensSchema = z.object({
  fromAsset: z.string(),
  toAsset: z.string(),
  amount: amountSchema,
  chain: chainSchema,
  slippageTolerance: z.number().min(0).max(100).default(1),
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