import { getAllSupportedChains, getChainById, type KnownChainId, type Chain, ChainIdRelay } from './chains'
import { paseoChain } from './supported-chains'
import { queryHrmpChannels } from '../utils/getHrmpChannels'
import { 
  HrmpNotSupportedError, 
  ParachainNotSupportedError, 
  RelayChainNotSupportedError 
} from '../types/errors'
import { type HrmpValidationResult } from '../types/hrmp'
import { buildHrmpGraph, findHrmpPathBfs } from '../utils/findHrmpPath'

/**
 * Configuration for HRMP validation
 */
interface HrmpValidationConfig {
  readonly supportedChains: readonly Chain[]
  readonly paseoChainId: string
}

/**
 * Validates if a chain is a valid parachain or system chain on Paseo
 */
function isValidPaseoChain(chain: Chain, paseoChainId: string): boolean {
  return (
    (chain.type === 'para' || chain.type === 'system') && 
    chain.relay === paseoChainId
  )
}

/**
 * Validates Paseo relay chain configuration
 */
function validatePaseoRelayChain(paseo: Chain): asserts paseo is Chain & { id: 'paseo' } {
  if (paseo.id !== 'paseo') {
    throw new RelayChainNotSupportedError(paseo.id)
  }
}

/**
 * Validates source and destination chains for HRMP compatibility
 */
function validateChainCompatibility(
  sourceChain: Chain, 
  destinationChain: Chain, 
  paseoChainId: string
): void {
  if (!isValidPaseoChain(sourceChain, paseoChainId)) {
    throw new ParachainNotSupportedError(sourceChain.id)
  }

  if (!isValidPaseoChain(destinationChain, paseoChainId)) {
    throw new ParachainNotSupportedError(destinationChain.id)
  }
}

/**
 * Finds HRMP channel between source and destination chains
 */
function findHrmpChannel(
  hrmpChannels: readonly HrmpChannel[], 
  sourceChainId: number, 
  destinationChainId: number
): HrmpChannel | undefined {
  return hrmpChannels.find(channel => 
    channel.sender === sourceChainId && 
    channel.recipient === destinationChainId
  )
}

/**
 * Transforms HRMP channel to validation result format
 */
function transformHrmpChannel(channel: HrmpChannel): HrmpValidationResult['channel'] {
  return {
    sender: channel.sender,
    recipient: channel.recipient,
    maxCapacity: channel.max_capacity,
    maxTotalSize: channel.max_total_size,
    maxMessageSize: channel.max_message_size,
    messageCount: channel.msg_count,
    totalSize: channel.total_size,
    senderDeposit: channel.sender_deposit
  }
}

/**
 * Validates HRMP support on Paseo between source and destination chains
 * 
 * @param source - Source chain identifier
 * @param destination - Destination chain identifier
 * @returns Promise resolving to validation result with channel information if valid
 * 
 * @throws {RelayChainNotSupportedError} When Paseo relay chain is not supported
 * @throws {ParachainNotSupportedError} When source or destination chain is not a valid Paseo parachain
 * @throws {HrmpNotSupportedError} When HRMP is not supported on Paseo
 * 
 * @example
 * ```typescript
 * const result = await isHrmpSupportedOnPaseo('hydra', 'polkadot_asset_hub')
 * if (result.isValid) {
 *   console.log('HRMP channel found:', result.channel)
 * }
 * ```
 */
export async function isHrmpSupportedOnPaseo(
  source: KnownChainId, 
  destination: KnownChainId
): Promise<HrmpValidationResult> {
  const config: HrmpValidationConfig = {
    supportedChains: getAllSupportedChains(),
    paseoChainId: paseoChain.id
  }

  // Validate Paseo relay chain
  const paseo = getChainById(paseoChain.id, config.supportedChains as Chain[])
  validatePaseoRelayChain(paseo)

  // Validate source and destination chains
  const sourceChain = getChainById(source, config.supportedChains as Chain[])
  const destinationChain = getChainById(destination, config.supportedChains as Chain[])
  validateChainCompatibility(sourceChain, destinationChain, config.paseoChainId)

  // Query HRMP channels
  const hrmpChannels = await queryHrmpChannels(config.paseoChainId as ChainIdRelay)
  
  if (hrmpChannels.length === 0) {
    throw new HrmpNotSupportedError(config.paseoChainId as ChainIdRelay)
  }

  // Find HRMP channel between source and destination
  const hrmpChannel = findHrmpChannel(
    hrmpChannels, 
    sourceChain.chainId!, 
    destinationChain.chainId!
  )

  if (hrmpChannel) {
    // Direct channel found
    return {
      isValid: true,
      channel: transformHrmpChannel(hrmpChannel)
    }
  }

  // No direct channel, so attempt to find a multi-hop path
  const graph = buildHrmpGraph(hrmpChannels)
  const path = findHrmpPathBfs(graph, sourceChain.chainId!, destinationChain.chainId!)

  if (path) {
    return {
      isValid: true,
      path
    }
  }

  // No direct or multi-hop path found
  return { isValid: false, path: null }
}

// Type alias for internal use
type HrmpChannel = {
  readonly sender: number
  readonly recipient: number
  readonly max_capacity: number
  readonly max_total_size: number
  readonly max_message_size: number
  readonly msg_count: number
  readonly total_size: number
  readonly mqc_head: unknown
  readonly sender_deposit: bigint
}