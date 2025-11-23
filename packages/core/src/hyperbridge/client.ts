import type {
  HyperbridgeConfig,
  MessageDetails,
  VerificationRequest,
  VerificationResult
} from "./types"
import { MessageStatus } from "./types"

/**
 * API response types
 */
interface ApiResponse {
  success: boolean
  error?: string
  proof?: unknown
  data?: unknown
}

interface VerificationApiResponse extends ApiResponse {
  proof?: {
    sourceChain: string
    destinationChain: string
    messageHash: string
    timestamp: number
    proof: string
    signatures: string[]
  }
}

interface MessageApiResponse extends ApiResponse {
  data?: MessageDetails
}

/**
 * Hyperbridge client for cross-chain verification
 */
export class HyperbridgeClient {
  private config: HyperbridgeConfig
  private endpoint: string

  constructor(config: HyperbridgeConfig = {}) {
    this.config = {
      endpoint:
        config.endpoint || process.env.HYPERBRIDGE_ENDPOINT || "https://api.hyperbridge.network",
      apiKey: config.apiKey || process.env.HYPERBRIDGE_API_KEY,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      ...config
    }
    this.endpoint = this.config.endpoint!
  }

  /**
   * Verify a cross-chain message
   */
  async verifyMessage(request: VerificationRequest): Promise<VerificationResult> {
    try {
      const response = await this.makeRequest<VerificationApiResponse>(`/verify`, {
        method: "POST",
        body: JSON.stringify({
          messageHash: request.messageHash,
          sourceChain: request.sourceChain,
          destinationChain: request.destinationChain
        })
      })

      if (!response.success) {
        return {
          success: false,
          status: MessageStatus.FAILED,
          messageHash: request.messageHash,
          error: response.error || "Verification failed"
        }
      }

      return {
        success: true,
        status: MessageStatus.VERIFIED,
        messageHash: request.messageHash,
        proof: response.proof,
        verifiedAt: new Date()
      }
    } catch (error) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        messageHash: request.messageHash,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Get message details
   */
  async getMessageDetails(messageHash: string): Promise<MessageDetails | null> {
    try {
      const response = await this.makeRequest<MessageApiResponse>(`/message/${messageHash}`, {
        method: "GET"
      })

      if (!response.success || !response.data) {
        return null
      }

      return response.data
    } catch (_error) {
      // Failed to get message details - return null
      return null
    }
  }

  /**
   * Poll for message status until verified or timeout
   */
  async waitForVerification(
    messageHash: string,
    sourceChain: string,
    destinationChain: string,
    maxAttempts = 10,
    delayMs = 3000
  ): Promise<VerificationResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.verifyMessage({
        messageHash,
        sourceChain,
        destinationChain
      })

      if (result.success && result.status === MessageStatus.VERIFIED) {
        return result
      }

      if (result.status === MessageStatus.FAILED) {
        return result
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    return {
      success: false,
      status: MessageStatus.TIMEOUT,
      messageHash,
      error: "Verification timeout: Message not verified within the time limit"
    }
  }

  /**
   * Make an API request to Hyperbridge
   */
  private async makeRequest<T = ApiResponse>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.endpoint}${path}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    }

    // Add custom headers if provided
    if (options.headers) {
      const customHeaders = options.headers as Record<string, string>
      Object.assign(headers, customHeaders)
    }

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout!)
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(
        `Hyperbridge API error: ${response.status} - ${errorData.message || response.statusText}`
      )
    }

    return (await response.json()) as T
  }
}

/**
 * Create a Hyperbridge client instance
 */
export function createHyperbridgeClient(config?: HyperbridgeConfig): HyperbridgeClient {
  return new HyperbridgeClient(config)
}
