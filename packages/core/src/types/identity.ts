import { IdentityData } from "@polkadot-api/descriptors"
import { FixedSizeBinary } from "polkadot-api"

export const getRawFromValue = (value: string) => `Raw${value.length}`

export const getRawOrNone = (value?: string) => {
  return (
    value
      ? { type: getRawFromValue(value), value: FixedSizeBinary.fromText(value) }
      : { type: "None" }
  ) as IdentityData
}
