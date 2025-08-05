
export interface PolkadotMCPServerConfig {
  name: string;
  version: string;
  privateKey: string;
}

export interface BalanceResult {
  balance: string;
  symbol: string;
  chain: string;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface StakingResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface XCMResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  data?: any;
}

export interface XcmTransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  data?: any;
}

export enum MCPErrorType {
  VALIDATION_ERROR = "validation_error",
  NETWORK_ERROR = "network_error",
  CHAIN_ERROR = "chain_error", 
  INSUFFICIENT_FUNDS = "insufficient_funds",
  INVALID_ADDRESS = "invalid_address",
  TOOL_NOT_FOUND = "tool_not_found",
}

export class MCPError extends Error {
  constructor(
    public type: MCPErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "MCPError";
  }
}

export * from './schemas'; 