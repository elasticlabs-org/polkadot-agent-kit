export * from "./swap"

export interface SwapContext {
  from: string
  to: string
  currencyFrom: string
  currencyTo: string
  amount: string
  sender: string
  receiver: string
  dex: string
  isCrossChainSwap: boolean
}

export interface TransactionResult {
  success: boolean
  transactionHash?: string
  error?: string
}
