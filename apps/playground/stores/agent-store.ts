import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import React from 'react'
import { checkInitializationStatus } from '@/app/config/actions'

interface AgentConfig {
  privateKey: string
  keyType: "Sr25519" | "Ed25519"
  chains: string[]
  isConfigured?: boolean
}

interface AgentState {
  // Configuration (non-sensitive UI state only)
  config: Omit<AgentConfig, 'privateKey'> | null
  isConfigured: boolean
  
  // Initialization status (synced with server)
  isInitialized: boolean
  isInitializing: boolean
  
  // Actions
  setConfig: (config: Omit<AgentConfig, 'privateKey'>) => void
  initializeAgent: () => Promise<void>
  resetAgent: () => void
  setInitializing: (loading: boolean) => void
  syncInitializationStatus: () => Promise<void>
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      isConfigured: false,
      isInitialized: false,
      isInitializing: false,

      // Actions
      setConfig: (config: Omit<AgentConfig, 'privateKey'>) => {
        set({ 
          config,
          isConfigured: config.isConfigured || false
        })
      },

      setInitializing: (isInitializing: boolean) => {
        set({ isInitializing })
      },

      syncInitializationStatus: async () => {
        try {
          const status = await checkInitializationStatus()
          set({
            isInitialized: status.isInitialized,
            isConfigured: status.hasAgentConfig && status.hasLlmConfig
          })
        } catch (error) {
          console.error('[AgentStore] Failed to sync initialization status:', error)
          set({
            isInitialized: false,
            isConfigured: false
          })
        }
      },

      initializeAgent: async () => {
        // Agent initialization is now handled by server actions
        // This function is kept for compatibility but just syncs status
        try {
          set({ isInitializing: true })
          await get().syncInitializationStatus()
          set({ isInitializing: false })
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
          isInitialized: false,
          isInitializing: false
        })
      }
    }),
    {
      name: 'polkadot-agent-store',
      partialize: (state: AgentState) => ({
        config: state.config,
        isConfigured: state.isConfigured,
        isInitialized: state.isInitialized
      }),
      storage: createJSONStorage(() => localStorage)
    }
  ))

// Hook to automatically sync initialization status on page load
export const useAgentRestore = () => {
  const { syncInitializationStatus } = useAgentStore()
  
  React.useEffect(() => {
    syncInitializationStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
