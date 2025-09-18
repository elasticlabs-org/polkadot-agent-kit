"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Zap, Terminal } from "lucide-react"
import Sidebar from "@/components/sidebar"

interface ToolCall {
  id: string
  tool: string
  method: string
  params: string
  response?: string
  status: "pending" | "success" | "error"
}

interface AgentConfig {
  llmProvider: string
  llmModel: string
  apiKey: string
  privateKey: string
  keyType: string
  chains: string[]
  isConfigured: boolean
}

export default function DeveloperPage() {
  const [selectedTool, setSelectedTool] = useState("")
  const [toolMethod, setToolMethod] = useState("")
  const [toolParams, setToolParams] = useState("")
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)

  const tools = [
    { value: "xcm", label: "XCM SDK", description: "Cross-chain message transfer tools" },
    { value: "router", label: "XCM Router", description: "Optimal routing for cross-chain transfers" },
    { value: "analyzer", label: "XCM Analyzer", description: "Analyze cross-chain transactions" },
    { value: "substrate", label: "Substrate Tools", description: "Blockchain development utilities" },
    { value: "governance", label: "Governance API", description: "Democracy and council interactions" },
    { value: "identity", label: "Identity Registry", description: "On-chain identity management" },
  ]

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("polkadot-agent-config")
    if (savedConfig) {
      setAgentConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleRunTool = async () => {
    if (!selectedTool || !toolMethod || !agentConfig?.isConfigured) return

    const toolCall: ToolCall = {
      id: Date.now().toString(),
      tool: selectedTool,
      method: toolMethod,
      params: toolParams,
      status: "pending",
    }

    setToolCalls((prev) => [...prev, toolCall])

    // Simulate tool execution
    setTimeout(() => {
      const mockResponses = {
        xcm: {
          transfer_status: "success",
          origin_chain: "Astar",
          destination_chain: "Hydration",
          asset: "DOT",
          amount: "100000000000000000",
          fee_asset: "DOT",
        },
        router: {
          optimal_route: ["Astar", "AssetHub", "Hydration"],
          estimated_fee: "0.01 DOT",
          execution_time: "~12 seconds",
        },
        analyzer: {
          transaction_hash: "0x1234...abcd",
          status: "completed",
          blocks_confirmed: 3,
          total_fee: "0.008 DOT",
        },
      }

      const responseData = mockResponses[selectedTool as keyof typeof mockResponses] || {
        message: "Tool executed successfully",
        timestamp: new Date().toISOString(),
      }

      setToolCalls((prev) =>
        prev.map((call) =>
          call.id === toolCall.id
            ? {
                ...call,
                status: "success",
                response: JSON.stringify(
                  {
                    status: "success",
                    data: responseData,
                    network: "polkadot",
                    block_height: Math.floor(Math.random() * 1000000) + 18000000,
                  },
                  null,
                  2,
                ),
              }
            : call,
        ),
      )
    }, 2000)
  }

  return (
    <div className="modern-container">
      <div className="flex h-screen">
        <Sidebar currentPage="developer" />

        <div className="flex-1 flex flex-col">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold modern-text-primary">Developer Portal</h2>
                <Badge className="modern-badge font-medium px-3 py-1">Tools</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`px-3 py-1 ${agentConfig?.isConfigured ? "modern-badge" : "bg-red-900/30 text-red-400 border-red-700"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${agentConfig?.isConfigured ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                  />
                  {agentConfig?.isConfigured ? "Agent Ready" : "Configuration Required"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Tool Selection */}
              <Card className="p-8 modern-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 modern-text-primary">
                  <Terminal className="w-6 h-6" />
                  Polkadot API Tools
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Select API Endpoint</label>
                    <Select value={selectedTool} onValueChange={setSelectedTool}>
                      <SelectTrigger className="h-12 modern-select">
                        <SelectValue placeholder="Choose a Polkadot API..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tools.map((tool) => (
                          <SelectItem key={tool.value} value={tool.value}>
                            <div className="py-1">
                              <div className="font-medium">{tool.label}</div>
                              <div className="text-xs modern-text-secondary">{tool.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Method Name</label>
                    <Input
                      placeholder="e.g., transfer, get_route, analyze_tx"
                      value={toolMethod}
                      onChange={(e) => setToolMethod(e.target.value)}
                      className="h-12 modern-input"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-semibold mb-3 block modern-text-primary">Parameters (JSON)</label>
                  <Textarea
                    placeholder='{"origin": "Astar", "destination": "Hydration", "currency": "DOT", "amount": "1000000000000"}'
                    value={toolParams}
                    onChange={(e) => setToolParams(e.target.value)}
                    className="font-mono text-sm modern-input min-h-[120px]"
                    rows={5}
                  />
                </div>

                <Button
                  onClick={handleRunTool}
                  disabled={!selectedTool || !toolMethod || !agentConfig?.isConfigured}
                  className="mt-6 px-8 h-12 text-base font-medium modern-button-primary"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Execute API Call
                </Button>
              </Card>

              {/* Tool Execution Results */}
              <Card className="p-8 modern-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 modern-text-primary">
                  <Zap className="w-6 h-6" />
                  API Response
                </h3>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    {toolCalls.length === 0 ? (
                      <div className="text-center modern-text-secondary py-12">
                        <Terminal className="w-16 h-16 mx-auto mb-6 opacity-30" />
                        <p className="text-lg mb-2">No API calls executed yet</p>
                        <p className="text-sm">Configure and run a Polkadot API tool above to see results here.</p>
                      </div>
                    ) : (
                      toolCalls.map((call) => (
                        <div key={call.id} className="modern-form-section">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge className="modern-badge font-medium">{call.tool}</Badge>
                              <span className="text-sm font-mono bg-white/10 px-2 py-1 rounded text-white">
                                {call.method}
                              </span>
                            </div>
                            <Badge
                              className={
                                call.status === "success"
                                  ? "bg-green-900/30 text-green-400 border-green-700"
                                  : call.status === "error"
                                    ? "bg-red-900/30 text-red-400 border-red-700"
                                    : "bg-white/10 text-white border-white/20"
                              }
                            >
                              {call.status}
                            </Badge>
                          </div>

                          {call.params && (
                            <div className="mb-4">
                              <div className="text-xs font-semibold mb-2 modern-text-primary">Parameters:</div>
                              <pre className="text-xs bg-black/30 p-3 rounded-lg font-mono overflow-x-auto border border-white/10 text-white">
                                {call.params}
                              </pre>
                            </div>
                          )}

                          {call.response && (
                            <div>
                              <div className="text-xs font-semibold mb-2 modern-text-primary">Response:</div>
                              <pre className="text-xs bg-black/30 p-3 rounded-lg font-mono overflow-x-auto border border-white/10 max-h-64 text-white">
                                {call.response}
                              </pre>
                            </div>
                          )}

                          {call.status === "pending" && (
                            <div className="flex items-center gap-3 text-sm modern-text-secondary">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Executing API call...
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
