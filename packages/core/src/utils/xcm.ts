import type { TDestination, TNodeDotKsmWithRelayChains } from "@paraspell/sdk"
import { Builder, getNativeAssets } from "@paraspell/sdk"

export async function estimateXcmFee(
  srcChain: string,
  from: string,
  destChain: string,
  to: string,
  amount: string
) {
  const nativeSymbol = getNativeAssets(srcChain as TNodeDotKsmWithRelayChains)
  const fee = await Builder()
    .from(srcChain as TNodeDotKsmWithRelayChains)
    .senderAddress(from)
    .to(destChain as TDestination)
    .currency({ symbol: nativeSymbol[0].symbol, amount })
    .address(to)
    .getOriginXcmFee()

  return fee
}
