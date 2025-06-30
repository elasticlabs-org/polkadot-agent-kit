export enum ErrorCodes {

    /** Chain is not supported by the system */
    COMMON_RELAY_CHAIN_NOT_SUPPORTED = 1001,

    /** Chain is not supported by the system */
    COMMON_PARACHAIN_NOT_SUPPORTED = 1002,

    /** Hrmp is not supported on the chain */
    COMMON_HRMP_NOT_SUPPORTED = 1003,

}

/**
 * Base interface for tool errors with numeric error codes.
 */
export interface CommonError extends Error {
    /** Numeric error code for programmatic handling */
    code: ErrorCodes
    /** Optional additional error details */
    details?: unknown
}

/**
 * Error thrown when a requested blockchain network is not available.
 *
 * @example
 * ```typescript
 * throw new RelayChainNotSupportedError("invalid-chain", ["polkadot", "kusama"]);
 * // Error: Chain 'invalid-chain' not available. Available chains: polkadot, kusama
 * // error.code === 1001
 * 
 * 
 * ```
 */
export class RelayChainNotSupportedError extends Error implements CommonError {
    code = ErrorCodes.COMMON_RELAY_CHAIN_NOT_SUPPORTED

    constructor(chain: string) {
        super(`Chain '${chain}' not available.`)
        this.name = "RelayChainNotSupportedError"
    }
}


export class ParachainNotSupportedError extends Error implements CommonError {
    code = ErrorCodes.COMMON_PARACHAIN_NOT_SUPPORTED

    constructor(chain: string) {
        super(`Chain '${chain}' not available.`)
        this.name = "ParachainNotSupportedError"
    }
}

export class HrmpNotSupportedError extends Error implements CommonError {
    code = ErrorCodes.COMMON_HRMP_NOT_SUPPORTED

    constructor(chain: string) {
        super(`Hrmp is not supported on chain '${chain}'.`)
        this.name = "HrmpNotSupportedError"
    }
}
