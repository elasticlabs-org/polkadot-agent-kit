export interface BalanceInfo {
  balance: bigint
  decimals: number
  symbol: string
}

export interface AccountData {
  nonce: number;
  consumers: number;
  providers: number;
  sufficients: number;
  data: {
      free: bigint;
      reserved: bigint;
      frozen: bigint;
      flags: bigint;
  };
}
