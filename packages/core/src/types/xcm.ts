import { TPapiTransaction } from "@paraspell/sdk"

export interface XcmTransferResult {
    success: boolean
    transaction?: TPapiTransaction
    error?: string
    dryRunDetails?: {
      originSuccess: boolean
      destinationSuccess: boolean
      originError?: string
      destinationError?: string
    }
}


  