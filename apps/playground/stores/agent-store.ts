import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import React from 'react'

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
  
  // Session management
  sessionExpiry: number | null
  
  // Actions
  setConfig: (config: AgentConfig) => void
  initializeAgent: () => Promise<void>
  resetAgent: () => void
  setInitializing: (loading: boolean) => void
  checkSession: () => boolean
  restoreAgent: () => Promise<void>
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set: any, get: any) => {
      // Check session on store initialization
      const checkAndRestoreSession = () => {
        const { sessionExpiry, isInitialized, config } = get()
        if (sessionExpiry && isInitialized && config) {
          const now = Date.now()
          if (now > sessionExpiry) {
            // Session expired, reset
            set({
              agentKit: null,
              isInitialized: false,
              sessionExpiry: null
            })
            return false
          }
          // Session is valid, but we need to reinitialize the agentKit
          // since it can't be serialized
          return true
        }
        return false
      }

      return {
      // Initial state
      config: null,
      isConfigured: false,
      agentKit: null,
      isInitialized: false,
      isInitializing: false,
      sessionExpiry: null,

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

      checkSession: () => {
        const { sessionExpiry, isInitialized } = get()
        if (!sessionExpiry || !isInitialized) return false
        
        const now = Date.now()
        if (now > sessionExpiry) {
          // Session expired, reset agent
          set({
            agentKit: null,
            isInitialized: false,
            sessionExpiry: null
          })
          return false
        }
        return true
      },

      restoreAgent: async () => {
        const { config, sessionExpiry } = get()
        if (!config || !sessionExpiry) return

        const now = Date.now()
        if (now > sessionExpiry) {
          // Session expired
          set({
            agentKit: null,
            isInitialized: false,
            sessionExpiry: null
          })
          return
        }

        try {
          set({ isInitializing: true })
          
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

          console.log('[AgentStore] Agent restored successfully')
        } catch (error) {
          console.error('[AgentStore] Failed to restore agent:', error)
          set({ 
            isInitialized: false,
            isInitializing: false
          })
        }
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

          // Set session expiry to 15 minutes from now
          const sessionExpiry = Date.now() + (15 * 60 * 1000) // 15 minutes
          
          set({ 
            agentKit,
            isInitialized: true,
            isInitializing: false,
            sessionExpiry
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
          isInitializing: false,
          sessionExpiry: null
        })
      }
      }
    }),
    {
      name: 'polkadot-agent-store',
      partialize: (state: any) => ({
        config: state.config,
        isConfigured: state.isConfigured,
        isInitialized: state.isInitialized,
        sessionExpiry: state.sessionExpiry
      })
    }
  )

// Hook to automatically restore agent on page load
export const useAgentRestore = () => {
  const { isInitialized, agentKit, restoreAgent, checkSession } = useAgentStore()
  
  React.useEffect(() => {
    // Check if we have a valid session but no agent instance
    if (checkSession() && !agentKit) {
      restoreAgent()
    }
  }, [])
}
