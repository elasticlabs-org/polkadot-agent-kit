import { bifrostPolkadotChain, getParaChainClient } from "@polkadot-agent-kit/common"
import { bifrost_polkadot } from "@polkadot-api/descriptors"
import { Binary } from "polkadot-api"

import type { Tx } from "../types"

/**
 * Creates a transaction to mint vDOT tokens by staking DOT on Bifrost
 *
 * This function allows users to stake DOT and receive vDOT (liquid staking tokens) in return.
 * vDOT represents staked DOT plus accumulated staking rewards and can be used in DeFi
 * while earning staking rewards.
 *
 * @param amount - The amount of DOT to stake (in smallest unit, e.g., planck for DOT)
 * @returns A transaction object that can be signed and submitted to mint vDOT
 */

export const mintVDot = async (amount: bigint): Promise<Tx> => {
  const client = await getParaChainClient(bifrostPolkadotChain, {})
  const api = client.getTypedApi(bifrost_polkadot)

  return api.tx.VtokenMinting.mint({
    currency_id: { type: "Token2", value: 0 },
    currency_amount: amount,
    remark: Binary.fromText(""),
    channel_id: undefined
  })
}
