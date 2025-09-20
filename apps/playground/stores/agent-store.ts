import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AgentConfig {
  privateKey: string
  keyType: "Sr25519" | "Ed25519"
  chains: string[]
  isConfigured?: boolean
}

interface AgentState {
  // Configuration
  config: AgentConfig | null
  isConfigured: boolean
  
  // Agent instance
  agentKit: any | null
  isInitialized: boolean
  isInitializing: boolean
  
  // Actions
  setConfig: (config: AgentConfig) => void
  initializeAgent: () => Promise<void>
  resetAgent: () => void
  setInitializing: (loading: boolean) => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set: any, get: any) => ({
      // Initial state
      config: null,
      isConfigured: false,
      agentKit: null,
      isInitialized: false,
      isInitializing: false,

      // Actions
      setConfig: (config: AgentConfig) => {
        set({ 
          config,
          isConfigured: config.isConfigured || false
        })
      },

      setInitializing: (isInitializing: boolean) => {
        set({ isInitializing })
      },

      initializeAgent: async () => {
        const { config } = get()
        if (!config || !config.isConfigured) {
          throw new Error('Agent not configured')
        }

        set({ isInitializing: true })

        try {
          const { PolkadotAgentKit } = await import("@polkadot-agent-kit/sdk")
          
          const agentKit = new PolkadotAgentKit({
            privateKey: config.privateKey,
            keyType: config.keyType,
            chains: config.chains as any,
          })

          await agentKit.initializeApi()

          set({ 
            agentKit,
            isInitialized: true,
            isInitializing: false
          })

          console.log('[AgentStore] Agent initialized successfully')
        } catch (error) {
          console.error('[AgentStore] Failed to initialize agent:', error)
          set({ 
            isInitialized: false,
            isInitializing: false
          })
          throw error
        }
      },

      resetAgent: () => {
        set({
          config: null,
          isConfigured: false,
          agentKit: null,
          isInitialized: false,
          isInitializing: false
        })
      }
    }),
    {
      name: 'polkadot-agent-store',
      partialize: (state: any) => ({
        config: state.config,
        isConfigured: state.isConfigured
      })
    }
  )
)
