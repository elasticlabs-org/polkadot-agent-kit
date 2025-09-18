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

interface AgentConfig {
  llmProvider: string
  llmModel: string
  apiKey: string
  privateKey: string
  keyType: string
  chains: string[]
  isConfigured: boolean
}

export default function ConfigPage() {
  const router = useRouter()
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    llmProvider: "",
    llmModel: "",
    apiKey: "",
    privateKey: "",
    keyType: "Sr25519",
    chains: ["paseo", "paseo_people"],
    isConfigured: false,
  })

  const llmProviders = [
    { value: "openai", label: "OpenAI", models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
    { value: "ollama", label: "Ollama", models: ["llama2", "codellama", "mistral", "neural-chat"] },
    { value: "anthropic", label: "Anthropic", models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"] },
  ]

  const keyTypes = ["Sr25519", "Ed25519", "Ecdsa"]
  const availableChains = ["polkadot", "kusama", "paseo", "paseo_people", "westend", "rococo"]

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("polkadot-agent-config")
    if (savedConfig) {
      setAgentConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleConfigureAgent = () => {
    if (!agentConfig.llmProvider || !agentConfig.apiKey || !agentConfig.privateKey) {
      alert("Please fill in all required fields")
      return
    }

    // Initialize PolkadotAgentKit (simulated)
    console.log("[v0] Initializing PolkadotAgentKit with config:", {
      privateKey: agentConfig.privateKey.substring(0, 10) + "...",
      keyType: agentConfig.keyType,
      chains: agentConfig.chains,
      llmProvider: agentConfig.llmProvider,
      llmModel: agentConfig.llmModel,
    })

    const updatedConfig = { ...agentConfig, isConfigured: true }
    setAgentConfig(updatedConfig)

    // Save to localStorage
    localStorage.setItem("polkadot-agent-config", JSON.stringify(updatedConfig))

    // Redirect to chat
    router.push("/chat")
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
                  className={`px-3 py-1 ${agentConfig.isConfigured ? "modern-badge" : "bg-red-900/30 text-red-400 border-red-700"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${agentConfig.isConfigured ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                  />
                  {agentConfig.isConfigured ? "Agent Ready" : "Configuration Required"}
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
                  />
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
                      <label className="text-sm font-semibold mb-3 block modern-text-primary">Chains</label>
                      <div className="flex flex-wrap gap-2">
                        {availableChains.map((chain) => (
                          <Button
                            key={chain}
                            variant="ghost"
                            size="sm"
                            className={`text-xs ${agentConfig.chains.includes(chain) ? "modern-button-primary" : "modern-nav-item"}`}
                            onClick={() => {
                              setAgentConfig((prev) => ({
                                ...prev,
                                chains: prev.chains.includes(chain)
                                  ? prev.chains.filter((c) => c !== chain)
                                  : [...prev.chains, chain],
                              }))
                            }}
                          >
                            {chain}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConfigureAgent}
                  disabled={!agentConfig.llmProvider || !agentConfig.apiKey || !agentConfig.privateKey}
                  className="mt-8 px-8 h-12 text-base font-medium modern-button-primary"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Configure Agent
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
