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
import { getRawOrNone, type Tx } from "../../types"

export const registerIdentity = async (
  api: Api<ChainIdPara>,
  display?: string,
  legal?: string,
  web?: string,
  matrix?: string,
  email?: string,
  image?: string,
  twitter?: string,
  github?: string,
  discord?: string
): Promise<Tx> => {
  // const peopleChainClient = await getParaChainClient(paseoPeopleChain, {})

  // const peopleChainApi = peopleChainClient.getTypedApi(paseo_people);

  const identityInfo = {
    display: getRawOrNone(display),
    legal: getRawOrNone(legal),
    web: getRawOrNone(web),
    matrix: getRawOrNone(matrix),
    email: getRawOrNone(email),
    image: getRawOrNone(image),
    twitter: getRawOrNone(twitter),
    github: getRawOrNone(github),
    discord: getRawOrNone(discord),
    pgp_fingerprint: undefined
  }

  const setIdentityCall = api.tx.Identity.set_identity({
    info: identityInfo as any
  })

  return setIdentityCall
}
