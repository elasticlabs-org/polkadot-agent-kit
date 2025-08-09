import { getAllSupportedChains, getChainById, paseoPeopleChain } from "@polkadot-agent-kit/common"

import type {
  Api,
  ChainIdAssetHub,
  ChainIdPara,
  ChainIdRelay,
  KnownChainId
} from "@polkadot-agent-kit/common"
import type { MultiAddress } from "@polkadot-api/descriptors"
import { getParaChainClient } from "@polkadot-agent-kit/common"
import { paseo_people, IdentityData } from "@polkadot-api/descriptors"
import type { Tx } from "../../types"

export const checkIdentity = async (
  display?: string,
  legal?: string,
  web?: string,
  matrix?: string,
  email?: string,
  image?: string,
  twitter?: string,
  github?: string,
  discord?: string
): Promise<{ destination: any; message: any }> => {
  const peopleChainClient = await getParaChainClient(paseoPeopleChain, {})

  const peopleChainApi = peopleChainClient.getTypedApi(paseo_people)

  const identityInfo = {
    display: display ? { Raw: new TextEncoder().encode(display) } : { None: null },
    legal: legal ? { Raw: new TextEncoder().encode(legal) } : { None: null },
    web: web ? { Raw: new TextEncoder().encode(web) } : { None: null },
    matrix: matrix ? { Raw: new TextEncoder().encode(matrix) } : { None: null },
    email: email ? { Raw: new TextEncoder().encode(email) } : { None: null },
    pgp_fingerprint: null,
    image: { None: null },
    twitter: twitter ? { Raw: new TextEncoder().encode(twitter) } : { None: null },
    github: github ? { Raw: new TextEncoder().encode(github) } : { None: null },
    discord: discord ? { Raw: new TextEncoder().encode(discord) } : { None: null }
  }

  console.log("Identity info:", JSON.stringify(identityInfo))

  const setIdentityCall = peopleChainApi.tx.Identity.set_identity({
    info: identityInfo as any
  }).decodedCall

  console.log("Set Identity call:", setIdentityCall)
  const destination = {
    V4: {
      parents: 0,
      interior: { X1: [{ Parachain: paseoPeopleChain.chainId }] }
    }
  }

  const message = {
    V4: [
      {
        // Instruction 1: Pay for fees
        WithdrawAsset: [
          {
            id: { parents: 1, interior: "Here" },
            fun: { Fungible: 100_000_000_000 }
          }
        ]
      },
      {
        // Instruction 2: Buy execution time
        BuyExecution: {
          fees: {
            id: { parents: 1, interior: "Here" },
            fun: { Fungible: 100_000_000_000 }
          },
          weight_limit: "Unlimited"
        }
      },
      {
        // Instruction 3: The transaction itself
        Transact: {
          origin_kind: "SovereignAccount",
          require_weight_at_most: { ref_time: 2_000_000_000, proof_size: 900_000 },
          call: setIdentityCall
        }
      }
    ]
  }
  console.log("Destination:", destination)
  console.log("MEssage:", message)
  return { destination, message }
}
