import type { Api, ChainIdPara } from "@polkadot-agent-kit/common"
import { Binary } from "polkadot-api"

import type { TxResult } from "../types/transaction"
import { dryRunCall, type DryRunResult } from "../utils/dryRun"

/**
 * Creates a transaction to mint vDOT tokens by staking DOT on Bifrost
 *
 * This function allows users to stake DOT and receive vDOT (liquid staking tokens) in return.
 * vDOT represents staked DOT plus accumulated staking rewards and can be used in DeFi
 * while earning staking rewards.
 *
 * @param amount - The amount of DOT to stake (in smallest unit, e.g., planck for DOT)
 * @param from - The sender's address (SS58 format)
 * @returns Promise resolving to TxResult with success/failure information
 *
 * @throws Error If the dry run indicates the transaction would fail
 */

export const mintVDot = async (
  api: Api<ChainIdPara>,
  from: string,
  amount: bigint
): Promise<TxResult> => {
  const tx = api.tx.VtokenMinting.mint({
    currency_id: { type: "Token2", value: 0 },
    currency_amount: amount,
    remark: Binary.fromText(""),
    channel_id: undefined
  })

  const dryRunResult: DryRunResult = await dryRunCall(api, from, tx)
  if (dryRunResult.value?.execution_result?.success) {
    return {
      success: true,
      transaction: tx
    }
  } else {
    const executionError = dryRunResult.value?.execution_result?.value

    if (executionError?.error) {
      const { error } = executionError

      let errorMessage = `${error.type} error: `

      if (error.value && typeof error.value === "object" && "type" in error.value) {
        errorMessage += error.value.type as string
        if (
          "value" in error.value &&
          error.value.value &&
          typeof error.value.value === "object" &&
          "type" in error.value.value
        ) {
          errorMessage += `.${error.value.value.type as string}`
        }
        errorMessage += " error"
      } else {
        errorMessage += "Unknown error"
      }

      return {
        success: false,
        error: errorMessage
      }
    }

    return {
      success: false,
      error: "Unknown error"
    }
  }
}
