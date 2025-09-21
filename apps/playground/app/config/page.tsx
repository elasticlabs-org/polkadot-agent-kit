"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Key, Cpu } from "lucide-react"
import Sidebar from "@/components/sidebar"
import { ChainSelector } from "@/components/chain-selector"
import { useAgentStore } from "@/stores/agent-store"
import type { KnownChainId, KeyType } from "@polkadot-agent-kit/common"
interface AgentConfig {
  llmProvider: string
  llmModel: string
  apiKey: string
  privateKey: string
  keyType: string
  chains: string[]
  isConfigured: boolean
}

interface Chain {
  id: string
  name: string
  specName: string
  type: "system" | "relay" | "para"
  symbol: string
  relay: string | null
  chainId: number | null
}

export default function ConfigPage() {
  const router = useRouter()
  const { 
    config, 
    isConfigured, 
    isInitialized, 
    isInitializing, 
    setConfig, 
    initializeAgent, 
    setInitializing 
  } = useAgentStore()
  
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    llmProvider: "",
    llmModel: "",
    apiKey: "",
    privateKey: "",
    keyType: "Sr25519",
    chains: ["paseo"],
    isConfigured: false,
  })
  const [llmConnected, setLlmConnected] = useState<"idle" | "ok" | "error">("idle")

  // Function to validate OpenAI API key and check for gpt-4o-mini availability
  const validateOpenAIKey = async (apiKey: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      // First, check if API key is valid by listing models
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        return { 
          isValid: false, 
          error: `API key validation failed: ${response.status} ${response.statusText}` 
        }
      }

      const data = await response.json()
      const models = data.data || []
      
      // Check if gpt-4o-mini is available
      const hasGpt4oMini = models.some((model: any) => model.id === "gpt-4o-mini")
      
      if (!hasGpt4oMini) {
        return { 
          isValid: false, 
          error: "gpt-4o-mini model is not available with this API key" 
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error("OpenAI API validation error:", error)
      return { 
        isValid: false, 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
  const [availableChains, setAvailableChains] = useState<Chain[]>([])

  const llmProviders = [
    { value: "openai", label: "OpenAI", models: ["gpt-4o-mini"] },
    { value: "ollama", label: "Ollama", models: ["qwen3:latest"] },
  ]

  const keyTypes: KeyType[] = ["Sr25519", "Ed25519"]

  // Load available chains from common package
  useEffect(() => {
    const loadChains = async () => {
      try {
        const { getAllSupportedChains } = await import("@polkadot-agent-kit/common")
        const chains = getAllSupportedChains()
        setAvailableChains(chains.map(chain => ({
          id: chain.id,
          name: chain.name,
          specName: chain.specName,
          type: chain.type,
          symbol: chain.symbol,
          relay: chain.relay,
          chainId: chain.chainId,
        })))
      } catch (error) {
        console.error("Failed to load chains:", error)
        // Fallback to basic chains if import fails
        setAvailableChains([
          { id: "paseo", name: "Paseo", specName: "paseo", type: "relay", symbol: "DOT", relay: "paseo", chainId: 0 },
        ])
      }
    }
    loadChains()
  }, [])

  // Prefill from persisted store config (Polkadot) when available
  useEffect(() => {
    if (config) {
      setAgentConfig((prev) => ({
        ...prev,
        privateKey: config.privateKey || prev.privateKey,
        keyType: (config.keyType as string) || prev.keyType,
        chains: (config.chains as string[]) || prev.chains,
      }))
    }
  }, [config])

  // Prefill LLM config from localStorage when available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("llm_config")
      if (saved) {
        const { provider, model, apiKey } = JSON.parse(saved)
        setAgentConfig((prev) => ({
          ...prev,
          llmProvider: provider || prev.llmProvider,
          llmModel: model || prev.llmModel,
          apiKey: apiKey || prev.apiKey,
        }))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const handleConfigureAgent = async () => {
    const needsApiKey = agentConfig.llmProvider === "openai"

    // Determine what changed vs persisted values
    const prevLlmRaw = typeof window !== 'undefined' ? localStorage.getItem("llm_config") : null
    const prevLlm = prevLlmRaw ? JSON.parse(prevLlmRaw) : null
    const prevAgent = config

    const llmChanged = (() => {
      const prevProvider = prevLlm?.provider || ""
      const prevModel = prevLlm?.model || ""
      const prevApiKey = prevLlm?.apiKey || ""
      return (
        prevProvider !== agentConfig.llmProvider ||
        prevModel !== agentConfig.llmModel ||
        (needsApiKey && (prevApiKey || "") !== (agentConfig.apiKey || ""))
      )
    })()

    const chainsEqual = (a: string[] = [], b: string[] = []) => {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
      return true
    }
    const polkadotChanged = (() => {
      if (!prevAgent) return true
      return (
        prevAgent.privateKey !== agentConfig.privateKey ||
        prevAgent.keyType !== (agentConfig.keyType as any) ||
        !chainsEqual(prevAgent.chains as any, agentConfig.chains)
      )
    })()

    // Validate only the parts that changed
    if (llmChanged) {
      if (!agentConfig.llmProvider) {
        alert("Please select an LLM provider")
        return
      }
      if (needsApiKey) {
        const apiKey = agentConfig.apiKey || process.env.NEXT_PUBLIC_OPENAI_KEY
        if (!apiKey) {
          alert("API key is required for OpenAI. Provide it or set NEXT_PUBLIC_OPENAI_KEY.")
          return
        }
        agentConfig.apiKey = apiKey
      }
    }

    if (polkadotChanged) {
      if (!agentConfig.privateKey) {
        alert("Private key is required")
        return
      }
      if (!agentConfig.keyType) {
        alert("Please select a key type")
        return
      }
      if (!agentConfig.chains || agentConfig.chains.length === 0) {
        alert("Please select at least one chain")
        return
      }
    }

    setInitializing(true)
    setLlmConnected("idle")

    try {
      // If LLM changed, persist LLM config and (optionally) validate
      if (llmChanged) {
        localStorage.setItem("llm_config", JSON.stringify({
          provider: agentConfig.llmProvider,
          model: agentConfig.llmModel,
          apiKey: agentConfig.llmProvider === "openai" ? agentConfig.apiKey : null
        }))

        if (agentConfig.llmProvider === "ollama") {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 2500)
          try {
            const res = await fetch("http://127.0.0.1:11434/api/tags", { signal: controller.signal })
            setLlmConnected(res.ok ? "ok" : "error")
          } catch (_) {
            setLlmConnected("error")
          } finally {
            clearTimeout(timeout)
          }
        } else if (agentConfig.llmProvider === "openai") {
          try {
            const validation = await validateOpenAIKey(agentConfig.apiKey)
            setLlmConnected(validation.isValid ? "ok" : "error")
            if (!validation.isValid) {
              console.warn("OpenAI validation failed:", validation.error)
              alert(`OpenAI validation failed: ${validation.error}`)
            }
          } catch (e: any) {
            console.warn("OpenAI validation error:", e?.message || e)
            setLlmConnected("error")
          }
        }
      }

      // If Polkadot config changed, update store and (re)initialize agent
      if (polkadotChanged) {
        const storeConfig = {
          privateKey: agentConfig.privateKey,
          keyType: agentConfig.keyType as "Sr25519" | "Ed25519",
          chains: agentConfig.chains,
          isConfigured: true
        }
        try {
          setConfig(storeConfig)
        } catch (error) {
          console.error('[ConfigPage] Error calling setConfig:', error)
        }
        await initializeAgent()
      }

      const updatedConfig = { ...agentConfig, isConfigured: true }
      setAgentConfig(updatedConfig)

      router.push("/chat")
    } catch (err) {
      console.error("Failed to connect agent:", err)
      alert(
        `Failed to connect agent: ${err instanceof Error ? err.message : "Unknown error"}. ` +
          (agentConfig.llmProvider === "ollama" && llmConnected === "error"
            ? "Ollama seems unreachable at 127.0.0.1:11434. Ensure Ollama is running and the model is pulled."
            : "")
      )
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="modern-container">
      <div className="flex min-h-screen">
        <Sidebar currentPage="config" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none flex-shrink-0">
            <div className="flex items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold modern-text-primary">Agent Configuration</h2>
                <Badge className="modern-badge font-medium px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm">Setup</Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge
                  className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm ${isInitialized ? "modern-badge" : "bg-red-900/30 text-red-400 border-red-700"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${isInitialized ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                  />
                  <span className="hidden sm:inline">{isInitialized ? "Agent Ready" : "Configuration Required"}</span>
                  <span className="sm:hidden">{isInitialized ? "Ready" : "Required"}</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
              {/* LLM Configuration */}
              <Card className="p-4 sm:p-6 lg:p-8 modern-card">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 modern-text-primary">
                  <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
                  LLM Configuration
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">LLM Provider</label>
                    <Select
                      value={agentConfig.llmProvider}
                      onValueChange={(value) =>
                        setAgentConfig((prev) => ({ ...prev, llmProvider: value, llmModel: "" }))
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-12 modern-select">
                        <SelectValue placeholder="Select LLM Provider..." />
                      </SelectTrigger>
                      <SelectContent>
                        {llmProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Model</label>
                    <Select
                      value={agentConfig.llmModel}
                      onValueChange={(value) => setAgentConfig((prev) => ({ ...prev, llmModel: value }))}
                      disabled={!agentConfig.llmProvider}
                    >
                      <SelectTrigger className="h-10 sm:h-12 modern-select">
                        <SelectValue placeholder="Select Model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agentConfig.llmProvider &&
                          llmProviders
                            .find((p) => p.value === agentConfig.llmProvider)
                            ?.models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-semibold mb-3 block modern-text-primary">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key or leave empty to use NEXT_PUBLIC_OPENAI_KEY..."
                    value={agentConfig.apiKey}
                    onChange={(e) => setAgentConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    className="h-10 sm:h-12 modern-input font-mono"
                    disabled={agentConfig.llmProvider === "ollama"}
                  />
                  {agentConfig.llmProvider === "ollama" ? (
                    <p className="text-xs modern-text-secondary mt-2">API key not required for Ollama.</p>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs modern-text-secondary">
                        Leave empty to use NEXT_PUBLIC_OPENAI_KEY environment variable, or enter your API key directly.
                      </p>
                      {!agentConfig.apiKey && process.env.NEXT_PUBLIC_OPENAI_KEY && (
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          Using environment variable: NEXT_PUBLIC_OPENAI_KEY
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Agent Configuration */}
              <Card className="p-4 sm:p-6 lg:p-8 modern-card">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 modern-text-primary">
                  <Key className="w-5 h-5 sm:w-6 sm:h-6" />
                  Polkadot Agent Configuration
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Private Key</label>
                    <Input
                      type="password"
                      placeholder="Enter your private key..."
                      value={agentConfig.privateKey}
                      onChange={(e) => setAgentConfig((prev) => ({ ...prev, privateKey: e.target.value }))}
                      className="h-10 sm:h-12 modern-input font-mono"
                    />
                    <p className="text-xs modern-text-secondary mt-2">
                      Your private key is used to sign transactions and interact with the Polkadot network
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold mb-3 block modern-text-primary">Key Type</label>
                      <Select
                        value={agentConfig.keyType}
                        onValueChange={(value) => setAgentConfig((prev) => ({ ...prev, keyType: value }))}
                      >
                        <SelectTrigger className="h-10 sm:h-12 modern-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {keyTypes.map((keyType) => (
                            <SelectItem key={keyType} value={keyType}>
                              {keyType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <ChainSelector
                        selectedChains={agentConfig.chains}
                        onChainsChange={(chains) => {
                          setAgentConfig((prev) => ({
                            ...prev,
                            chains,
                          }))
                        }}
                        availableChains={availableChains}
                        disabled={isInitializing}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConfigureAgent}
                  disabled={
                    isInitializing
                  }
                  className="mt-6 sm:mt-8 px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium modern-button-primary w-full sm:w-auto"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  {isInitializing ? "Connecting..." : "Connect Agent"}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
