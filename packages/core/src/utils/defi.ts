import type { TExchangeInput } from "@paraspell/xcm-router"
import { getExchangePairs } from "@paraspell/xcm-router"

export function getPairSupported(
  sourceCurrency: string,
  destinationCurrency: string,
  exchange: string = "HydrationDex"
) {
  const pairs = getExchangePairs(exchange as TExchangeInput)
  const foundPair = pairs.find(pair => {
    const [currency1, currency2] = pair

    const isDirectMatch =
      (currency1.symbol === sourceCurrency && currency2.symbol === destinationCurrency) ||
      (currency1.symbol === destinationCurrency && currency2.symbol === sourceCurrency)

    return isDirectMatch
  })

  if (!foundPair) return null

  const [currency1, currency2] = foundPair

  if (currency1.symbol === sourceCurrency) {
    return [currency1, currency2]
  } else {
    return [currency2, currency1]
  }
}
