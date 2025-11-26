"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Key, Cpu, Loader2, Check, ArrowLeft, ArrowRight, Link } from "lucide-react"
import Sidebar from "@/components/sidebar"
import { ChainSelector } from "@/components/chain-selector"
import { useAgentStore, useIsInitialized } from "@/stores/agent-store"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()
  const { 
    config, 
    isConfigured, 
    isInitializing, 
    setConfig, 
    initializeAgent, 
    setInitializing 
  } = useAgentStore()
  const isInitialized = useIsInitialized()
  
  const [currentStep, setCurrentStep] = useState(1)
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
  const hasPrefilledConfig = useRef(false)

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step)
    }
  }

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
    { value: "gemini", label: "Gemini", models: ["gemini-2.0-flash"] },
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
  // Only prefill once on mount to avoid overwriting user input
  useEffect(() => {
    if (config && !hasPrefilledConfig.current) {
      setAgentConfig((prev) => ({
        ...prev,
        privateKey: prev.privateKey || config.privateKey || "",
        keyType: prev.keyType || (config.keyType as string) || "Sr25519",
        chains: prev.chains.length > 0 ? prev.chains : (config.chains as string[]) || ["paseo"],
      }))
      hasPrefilledConfig.current = true
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

  const validateStep1 = async (): Promise<boolean> => {
    if (!agentConfig.llmProvider) {
      alert("Please select an LLM provider")
      return false
    }
    if (!agentConfig.llmModel) {
      alert("Please select a model")
      return false
    }
    const needsApiKey = agentConfig.llmProvider === "openai" || agentConfig.llmProvider === "gemini"
    if (needsApiKey) {
      const apiKey = agentConfig.apiKey || 
        (agentConfig.llmProvider === "openai" ? process.env.NEXT_PUBLIC_OPENAI_KEY : process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
      if (!apiKey) {
        const envVar = agentConfig.llmProvider === "openai" ? "NEXT_PUBLIC_OPENAI_KEY" : "NEXT_PUBLIC_GOOGLE_API_KEY"
        alert(`API key is required for ${agentConfig.llmProvider}. Provide it or set ${envVar}.`)
        return false
      }
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!agentConfig.privateKey) {
      alert("Private key is required")
      return false
    }
    if (!agentConfig.keyType) {
      alert("Please select a key type")
      return false
    }
    if (!agentConfig.chains || agentConfig.chains.length === 0) {
      alert("Please select at least one chain")
      return false
    }
    return true
  }

  const handleStep1Continue = async () => {
    const isValid = await validateStep1()
    if (isValid) {
      // Persist LLM config
      const needsApiKey = agentConfig.llmProvider === "openai" || agentConfig.llmProvider === "gemini"
      const envApiKey = agentConfig.llmProvider === "openai"
        ? process.env.NEXT_PUBLIC_OPENAI_KEY
        : agentConfig.llmProvider === "gemini"
          ? process.env.NEXT_PUBLIC_GOOGLE_API_KEY
          : null
      const apiKeyToPersist = agentConfig.llmProvider === "ollama" ? null : (agentConfig.apiKey || envApiKey || null)
      localStorage.setItem("llm_config", JSON.stringify({
        provider: agentConfig.llmProvider,
        model: agentConfig.llmModel,
        apiKey: apiKeyToPersist
      }))

      // Validate LLM connection
      setLlmConnected("idle")
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
          const validation = await validateOpenAIKey(agentConfig.apiKey || envApiKey || "")
          setLlmConnected(validation.isValid ? "ok" : "error")
          if (!validation.isValid) {
            console.warn("OpenAI validation failed:", validation.error)
            alert(`OpenAI validation failed: ${validation.error}`)
            return
          }
        } catch (e: any) {
          console.warn("OpenAI validation error:", e?.message || e)
          setLlmConnected("error")
          return
        }
      } else if (agentConfig.llmProvider === "gemini") {
        setLlmConnected((agentConfig.apiKey || envApiKey) ? "ok" : "error")
      }

      nextStep()
    }
  }

  const handleStep2Continue = () => {
    if (validateStep2()) {
      nextStep()
    }
  }

  const handleConnect = async () => {
    const needsApiKey = agentConfig.llmProvider === "openai" || agentConfig.llmProvider === "gemini"

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

    setInitializing(true)
    setLlmConnected("idle")

    // Show connecting toast notification
    const connectingToast = toast({
      title: "Connecting",
      description: "Initializing agent, please wait...",
    })

    try {
      // If LLM changed, persist LLM config and (optionally) validate
      if (llmChanged) {
        const envApiKey = agentConfig.llmProvider === "openai"
          ? process.env.NEXT_PUBLIC_OPENAI_KEY
          : agentConfig.llmProvider === "gemini"
            ? process.env.NEXT_PUBLIC_GOOGLE_API_KEY
            : null
        const apiKeyToPersist = agentConfig.llmProvider === "ollama" ? null : (agentConfig.apiKey || envApiKey || null)
        localStorage.setItem("llm_config", JSON.stringify({
          provider: agentConfig.llmProvider,
          model: agentConfig.llmModel,
          apiKey: apiKeyToPersist
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
            const validation = await validateOpenAIKey(agentConfig.apiKey || envApiKey || "")
            setLlmConnected(validation.isValid ? "ok" : "error")
            if (!validation.isValid) {
              console.warn("OpenAI validation failed:", validation.error)
              alert(`OpenAI validation failed: ${validation.error}`)
            }
          } catch (e: any) {
            console.warn("OpenAI validation error:", e?.message || e)
            setLlmConnected("error")
          }
        } else if (agentConfig.llmProvider === "gemini") {
          setLlmConnected((agentConfig.apiKey || envApiKey) ? "ok" : "error")
        }
      }

      // If Polkadot config changed, update store and (re)initialize agent
      // Also re-initialize if only LLM changed but agent is not ready
      if (polkadotChanged || !isInitialized || llmChanged) {
        const storeConfig = {
          privateKey: agentConfig.privateKey,
          keyType: agentConfig.keyType as "Sr25519" | "Ed25519",
          chains: agentConfig.chains,
          isConfigured: true
        }
        
        // Only update store if config actually changed
        if (polkadotChanged) {
          try {
            setConfig(storeConfig)
          } catch (error) {
            console.error('[ConfigPage] Error calling setConfig:', error)
          }
        }
        
        // Re-initialize agent to ensure it picks up any environment/config changes
        // that might affect tool execution or API connections
        await initializeAgent()
      }

      const updatedConfig = { ...agentConfig, isConfigured: true }
      setAgentConfig(updatedConfig)

      // Dismiss connecting toast and show success
      connectingToast.dismiss()
      toast({
        title: "Connected",
        description: "Agent initialized successfully!",
      })

      router.push("/chat")
    } catch (err) {
      console.error("Failed to connect agent:", err)
      
      // Dismiss connecting toast and show error
      connectingToast.dismiss()
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      })
      
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

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed"
    if (step === currentStep) return "active"
    return "inactive"
  }

  const getChainNames = () => {
    return agentConfig.chains
      .map(chainId => {
        const chain = availableChains.find(c => c.id === chainId)
        return chain ? chain.name : chainId
      })
      .join(", ")
  }

  return (
    <div className="modern-container">
      <div className="flex min-h-screen">
        <Sidebar currentPage="config" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none flex-shrink-0">
            <div className="flex items-center justify-between p-4 sm:p-6 h-[73px] sm:h-[89px]">
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
            <div className="max-w-4xl mx-auto">
              {/* Step Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between relative">
                  {/* Connecting Line */}
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/10 -z-10">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                    />
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        getStepStatus(1) === "completed"
                          ? "bg-blue-500"
                          : getStepStatus(1) === "active"
                          ? "bg-blue-500"
                          : "bg-white/10"
                      }`}
                    >
                      {getStepStatus(1) === "completed" ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <span className={`text-lg font-semibold ${getStepStatus(1) === "active" ? "text-white" : "text-white/50"}`}>
                          1
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <h3 className={`text-sm font-semibold ${getStepStatus(1) === "active" || getStepStatus(1) === "completed" ? "modern-text-primary" : "modern-text-secondary"}`}>
                        LLM Configuration
                      </h3>
                      <p className="text-xs modern-text-secondary mt-1">Configure your AI provider</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        getStepStatus(2) === "completed"
                          ? "bg-blue-500"
                          : getStepStatus(2) === "active"
                          ? "bg-blue-500"
                          : "bg-white/10"
                      }`}
                    >
                      {getStepStatus(2) === "completed" ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <span className={`text-lg font-semibold ${getStepStatus(2) === "active" ? "text-white" : "text-white/50"}`}>
                          2
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <h3 className={`text-sm font-semibold ${getStepStatus(2) === "active" || getStepStatus(2) === "completed" ? "modern-text-primary" : "modern-text-secondary"}`}>
                        Agent Configuration
                      </h3>
                      <p className="text-xs modern-text-secondary mt-1">Set up your blockchain agent</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        getStepStatus(3) === "completed"
                          ? "bg-blue-500"
                          : getStepStatus(3) === "active"
                          ? "bg-blue-500"
                          : "bg-white/10"
                      }`}
                    >
                      {getStepStatus(3) === "completed" ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <span className={`text-lg font-semibold ${getStepStatus(3) === "active" ? "text-white" : "text-white/50"}`}>
                          3
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <h3 className={`text-sm font-semibold ${getStepStatus(3) === "active" || getStepStatus(3) === "completed" ? "modern-text-primary" : "modern-text-secondary"}`}>
                        Connect
                      </h3>
                      <p className="text-xs modern-text-secondary mt-1">Finalize and connect</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1: LLM Configuration */}
              {currentStep === 1 && (
                <Card className="p-4 sm:p-6 lg:p-8 modern-card">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold modern-text-primary">LLM Configuration</h3>
                        <p className="text-sm modern-text-secondary">Configure your AI language model provider</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="text-sm font-semibold mb-3 block modern-text-primary">AI Provider</label>
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

                    <div>
                      <label className="text-sm font-semibold mb-3 block modern-text-primary">API Key</label>
                      <Input
                        type="password"
                        placeholder={
                          agentConfig.llmProvider === "openai"
                            ? "Enter your API key or leave empty to use NEXT_PUBLIC_OPENAI_KEY..."
                            : agentConfig.llmProvider === "gemini"
                              ? "Enter your API key or leave empty to use NEXT_PUBLIC_GOOGLE_API_KEY..."
                              : "API key not required for Ollama"
                        }
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
                            Your API key will be stored securely and encrypted.
                          </p>
                          {!agentConfig.apiKey && agentConfig.llmProvider === "openai" && process.env.NEXT_PUBLIC_OPENAI_KEY && (
                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                              Using environment variable: NEXT_PUBLIC_OPENAI_KEY
                            </p>
                          )}
                          {!agentConfig.apiKey && agentConfig.llmProvider === "gemini" && process.env.NEXT_PUBLIC_GOOGLE_API_KEY && (
                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                              Using environment variable: NEXT_PUBLIC_GOOGLE_API_KEY
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <Button
                      onClick={handleStep1Continue}
                      className="px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium modern-button-primary"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 2: Agent Configuration */}
              {currentStep === 2 && (
                <Card className="p-4 sm:p-6 lg:p-8 modern-card">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold modern-text-primary">Agent Configuration</h3>
                        <p className="text-sm modern-text-secondary">Set up your blockchain agent credentials</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold mb-3 block modern-text-primary">Private Key</label>
                      <Input
                        type="password"
                        placeholder="Enter your private key..."
                        value={agentConfig.privateKey}
                        onChange={(e) => {
                          hasPrefilledConfig.current = true
                          setAgentConfig((prev) => ({ ...prev, privateKey: e.target.value }))
                        }}
                        className="h-10 sm:h-12 modern-input font-mono"
                      />
                      <p className="text-xs modern-text-secondary mt-2">
                        Your private key is encrypted and never leaves your device
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

                  <div className="flex justify-between mt-8">
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleStep2Continue}
                      className="px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium modern-button-primary"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 3: Connect */}
              {currentStep === 3 && (
                <Card className="p-4 sm:p-6 lg:p-8 modern-card">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Link className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold modern-text-primary">Ready to Connect</h3>
                        <p className="text-sm modern-text-secondary">Review your configuration and connect your agent</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-4 modern-text-primary">Configuration Summary</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-2 py-1 text-xs">
                              LLM
                            </Badge>
                            <span className="text-sm modern-text-primary">LLM Model</span>
                          </div>
                          <span className="text-sm modern-text-primary font-medium">
                            {agentConfig.llmProvider}-{agentConfig.llmModel || "Not selected"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-2 py-1 text-xs">
                              Agent
                            </Badge>
                            <span className="text-sm modern-text-primary">Blockchain</span>
                          </div>
                          <span className="text-sm modern-text-primary font-medium">
                            {getChainNames() || "Not selected"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleConnect}
                      disabled={isInitializing}
                      className="px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium modern-button-primary"
                    >
                      {isInitializing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting
                        </>
                      ) : (
                        <>
                          Connect Agent
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
