import type { Api, ChainIdPara } from "@polkadot-agent-kit/common"

import { getRawOrNone, type Tx } from "../../types"

export const registerIdentity = (
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
): Tx => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,  @typescript-eslint/no-unsafe-assignment
    info: identityInfo as any
  })

  return setIdentityCall
}
