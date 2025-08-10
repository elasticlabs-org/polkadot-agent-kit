import type { IdentityData } from "@polkadot-api/descriptors"
import type { FixedSizeArray } from "polkadot-api"
import { FixedSizeBinary } from "polkadot-api"

export const getRawFromValue = (value: string) => `Raw${value.length}`

export const getRawOrNone = (value?: string) => {
  return (
    value
      ? { type: getRawFromValue(value), value: FixedSizeBinary.fromText(value) }
      : { type: "None" }
  ) as IdentityData
}

export interface IdentityInfoPayload {
  additional: FixedSizeArray<2, IdentityData>[]
  display: IdentityData
  legal: IdentityData
  web: IdentityData
  riot: IdentityData
  email: IdentityData
  pgp_fingerprint: FixedSizeBinary<20> | undefined
  image: IdentityData
  twitter: IdentityData
}
