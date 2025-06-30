/**
 * Represents an HRMP channel between two parachains.
 * The fields are based on the Polkadot `hrmp.hrmpChannels` storage query.
 */
export interface HrmpChannel {
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

/**
 * The result of an HRMP validation check.
 * It can contain information about a direct channel or a multi-hop path.
 */
export interface HrmpValidationResult {
  readonly isValid: boolean
  readonly channel?: {
    readonly sender: number
    readonly recipient: number
    readonly maxCapacity: number
    readonly maxTotalSize: number
    readonly maxMessageSize: number
    readonly messageCount: number
    readonly totalSize: number
    readonly senderDeposit: bigint
  }
  /**
   * An array of parachain IDs representing the multi-hop path, if one was found.
   * e.g. `[2034, 4001, 3344]`
   */
  readonly path?: number[] | null
} 