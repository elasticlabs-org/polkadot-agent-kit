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
    chains: ["paseo", "paseo_people"],
    isConfigured: false,
  })
  const [llmConnected, setLlmConnected] = useState<"idle" | "ok" | "error">("idle")
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
          { id: "paseo_people", name: "Paseo People", specName: "paseo-people", type: "system", symbol: "DOT", relay: "paseo", chainId: 1004 },
        ])
      }
    }
    loadChains()
  }, [])

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("polkadot-agent-config")
    if (savedConfig) {
      setAgentConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleConfigureAgent = async () => {
    const needsApiKey = agentConfig.llmProvider === "openai"
    if (!agentConfig.llmProvider) {
      alert("Please select an LLM provider")
      return
    }
    if (needsApiKey && !agentConfig.apiKey) {
      alert("API key is required for OpenAI")
      return
    }
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

    setInitializing(true)
    setLlmConnected("idle")

    try {
      // Save API key temporarily in localStorage (client-side only)
      if (needsApiKey) {
        localStorage.setItem("llm_api_key", agentConfig.apiKey)
      } else {
        localStorage.removeItem("llm_api_key")
      }

      // Save LLM config to localStorage
      localStorage.setItem("llm_config", JSON.stringify({
        provider: agentConfig.llmProvider,
        model: agentConfig.llmModel,
        apiKey: agentConfig.apiKey
      }))

      // Create config for Zustand store
      const storeConfig = {
        privateKey: agentConfig.privateKey,
        keyType: agentConfig.keyType as "Sr25519" | "Ed25519",
        chains: agentConfig.chains,
        isConfigured: true
      }

      // Set config in Zustand store
      setConfig(storeConfig)

      // Initialize agent using Zustand store
      await initializeAgent()

      // Check LLM connectivity
      if (agentConfig.llmProvider === "ollama") {
        // Try ping local Ollama
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
        // We avoid calling OpenAI from browser due to CORS/security; assume ok if key provided
        setLlmConnected("ok")
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
      <div className="flex h-screen">
        <Sidebar currentPage="config" />

        <div className="flex-1 flex flex-col">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold modern-text-primary">Agent Configuration</h2>
                <Badge className="modern-badge font-medium px-3 py-1">Setup</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`px-3 py-1 ${isInitialized ? "modern-badge" : "bg-red-900/30 text-red-400 border-red-700"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${isInitialized ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                  />
                  {isInitialized ? "Agent Ready" : "Configuration Required"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* LLM Configuration */}
              <Card className="p-8 modern-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 modern-text-primary">
                  <Cpu className="w-6 h-6" />
                  LLM Configuration
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">LLM Provider</label>
                    <Select
                      value={agentConfig.llmProvider}
                      onValueChange={(value) =>
                        setAgentConfig((prev) => ({ ...prev, llmProvider: value, llmModel: "" }))
                      }
                    >
                      <SelectTrigger className="h-12 modern-select">
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
                      <SelectTrigger className="h-12 modern-select">
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
                    placeholder="Enter your API key..."
                    value={agentConfig.apiKey}
                    onChange={(e) => setAgentConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    className="h-12 modern-input font-mono"
                    disabled={agentConfig.llmProvider === "ollama"}
                  />
                  {agentConfig.llmProvider === "ollama" && (
                    <p className="text-xs modern-text-secondary mt-2">API key not required for Ollama.</p>
                  )}
                </div>
              </Card>

              {/* Agent Configuration */}
              <Card className="p-8 modern-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 modern-text-primary">
                  <Key className="w-6 h-6" />
                  Polkadot Agent Configuration
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Private Key</label>
                    <Input
                      type="password"
                      placeholder="Enter your private key..."
                      value={agentConfig.privateKey}
                      onChange={(e) => setAgentConfig((prev) => ({ ...prev, privateKey: e.target.value }))}
                      className="h-12 modern-input font-mono"
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
                        <SelectTrigger className="h-12 modern-select">
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
                    isInitializing ||
                    !agentConfig.llmProvider ||
                    !agentConfig.privateKey ||
                    agentConfig.chains.length === 0 ||
                    (agentConfig.llmProvider === "openai" && !agentConfig.apiKey)
                  }
                  className="mt-8 px-8 h-12 text-base font-medium modern-button-primary"
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
