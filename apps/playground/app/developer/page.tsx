"use client"

import { useEffect, useMemo, useState } from "react"
import Sidebar from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Zap, Terminal } from "lucide-react"

type ToolLike = { name?: string; description?: string; schema?: any; schemaJson?: any; call: (args: any) => Promise<any> }
type EndpointKey = "assets" | "swap" | "bifrost" | "staking"
type ToolsMap = Record<EndpointKey, Record<string, ToolLike>>

interface AgentConfigLocal {
  privateKey: string
  keyType: "Sr25519" | "Ed25519"
  chains: string[]
  isConfigured?: boolean
}

interface ToolCall {
  id: string
  tool: string
  method: string
  params: string
  response?: string
  status: "pending" | "success" | "error"
}

export default function DeveloperPage() {
  const [agentReady, setAgentReady] = useState(false)
  const [toolsMap, setToolsMap] = useState<ToolsMap | null>(null)

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointKey | "">("")
  const [selectedMethod, setSelectedMethod] = useState("")
  const [toolParams, setToolParams] = useState("{}")
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Load config from localStorage on mount and react to updates
  useEffect(() => {
    const sync = () => {
      const savedConfig = localStorage.getItem("polkadot-agent-config")
      if (savedConfig) {
        setAgentConfig(JSON.parse(savedConfig))
      } else {
        setAgentConfig(null)
      }
    }
    sync()
    const onStorage = (e: StorageEvent) => {
      if (e.key === "polkadot-agent-config") {
        sync()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

        const [{ PolkadotAgentKit }, { default: zodToJsonSchema }] = await Promise.all([
          import("@polkadot-agent-kit/sdk"),
          import("zod-to-json-schema"),
        ])

        const kit = new PolkadotAgentKit({
          privateKey: cfg.privateKey,
          keyType: cfg.keyType,
          chains: cfg.chains as any,
        })
        await kit.initializeApi()

        const ep: ToolsMap = {
          assets: {
            getNativeBalanceTool: kit.getNativeBalanceTool(),
            transferNativeTool: kit.transferNativeTool(),
            xcmTransferNativeTool: kit.xcmTransferNativeTool(),
          },
          swap: {
            swapTokensTool: kit.swapTokensTool(),
          },
          bifrost: {
            mintVdotTool: kit.mintVdotTool(),
          },
          staking: {
            joinPoolTool: kit.joinPoolTool(),
            bondExtraTool: kit.bondExtraTool(),
            unbondTool: kit.unbondTool(),
            withdrawUnbondedTool: kit.withdrawUnbondedTool(),
            claimRewardsTool: kit.claimRewardsTool(),
          },
        }

        for (const group of Object.values(ep)) {
          for (const [name, tool] of Object.entries(group)) {
            const anyTool = tool as any
            if (anyTool?.schema) {
              try {
                const fullSchema = zodToJsonSchema(anyTool.schema, name) as any
                // Extract the actual definition from $ref structure
                if (fullSchema?.$ref && fullSchema?.definitions) {
                  const refName = fullSchema.$ref.replace('#/definitions/', '')
                  anyTool.schemaJson = fullSchema.definitions[refName] || fullSchema
                } else {
                  anyTool.schemaJson = fullSchema
                }
              } catch {}
            }
          }
        }

        setToolsMap(ep)
        setAgentReady(true)
      } catch (e) {
        console.error("Developer init failed:", e)
        setAgentReady(false)
      }
    }
    init()
  }, [])

  const staticMethods: Record<EndpointKey, string[]> = {
    assets: [
      "getNativeBalanceTool",
      "transferNativeTool",
      "xcmTransferNativeTool",
    ],
    swap: [
      "swapTokensTool",
    ],
    bifrost: [
      "mintVdotTool",
    ],
    staking: [
      "joinPoolTool",
      "bondExtraTool",
      "unbondTool",
      "withdrawUnbondedTool",
      "claimRewardsTool",
    ],
  }

  const methodOptions = useMemo(() => {
    if (!selectedEndpoint) return []
    const dynamic = toolsMap ? Object.keys(toolsMap[selectedEndpoint] || {}) : []
    return dynamic.length ? dynamic : staticMethods[selectedEndpoint]
  }, [selectedEndpoint, toolsMap])

  const selectedTool = useMemo(() => {
    if (!selectedEndpoint || !selectedMethod || !toolsMap) return null
    return toolsMap[selectedEndpoint][selectedMethod]
  }, [selectedEndpoint, selectedMethod, toolsMap])

  const selectedSchemaJson = useMemo(() => {
    const sj = (selectedTool as any)?.schemaJson
    return sj ? JSON.stringify(sj, null, 2) : ""
  }, [selectedTool])

  const runTool = async () => {
    if (!selectedTool || isExecuting) return
    
    setIsExecuting(true)
    const id = String(Date.now())
    setToolCalls(prev => [...prev, { id, tool: selectedEndpoint || "", method: selectedMethod, params: toolParams, status: "pending" }])
    
    try {
      const parsed = toolParams ? JSON.parse(toolParams) : {}
      console.log("[Developer] Executing:", { endpoint: selectedEndpoint, method: selectedMethod, params: parsed })
      const res = await (selectedTool as any).call(parsed)
      console.log("[Developer] Response:", res)
      setToolCalls(prev => prev.map(c => c.id === id ? { ...c, status: "success", response: JSON.stringify(res, null, 2) } : c))
    } catch (err: any) {
      setToolCalls(prev => prev.map(c => c.id === id ? { ...c, status: "error", response: String(err?.message || err) } : c))
    } finally {
      setIsExecuting(false)
    }
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
                <Badge className={`px-3 py-1 ${agentReady ? "modern-badge" : "bg-red-900/30 text-red-400 border-red-700"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${agentReady ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                  {agentReady ? "Agent Ready" : "Configuration Required"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="max-w-5xl mx-auto space-y-8">
              <Card className="p-8 modern-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 modern-text-primary">
                  <Terminal className="w-6 h-6" />
                  Polkadot API Tools
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Select API Endpoint</label>
                    <Select value={selectedEndpoint} onValueChange={(v) => { setSelectedEndpoint(v as EndpointKey); setSelectedMethod(""); setToolParams("{}"); }}>
                      <SelectTrigger className="h-12 modern-select">
                        <SelectValue placeholder="Choose endpoint..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assets">Assets</SelectItem>
                        <SelectItem value="swap">Swap</SelectItem>
                        <SelectItem value="bifrost">Bifrost</SelectItem>
                        <SelectItem value="staking">Staking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1">
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Method</label>
                    <Select value={selectedMethod} onValueChange={setSelectedMethod} disabled={!selectedEndpoint}>
                      <SelectTrigger className="h-12 modern-select">
                        <SelectValue placeholder="Choose method..." />
                      </SelectTrigger>
                      <SelectContent>
                        {methodOptions.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1">
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Quick Params</label>
                    <Input
                      className="h-12 modern-input"
                      placeholder='e.g. {"chain":"paseo"}'
                      onChange={(e) => setToolParams(e.target.value)}
                      value={toolParams}
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Parameters (JSON)</label>
                    <Textarea
                      className="font-mono text-sm modern-input min-h-[160px]"
                      value={toolParams}
                      onChange={(e) => setToolParams(e.target.value)}
                      placeholder="{}"
                      rows={8}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Schema (readonly)</label>
                    <pre className="text-xs bg-black/30 p-3 rounded-lg font-mono overflow-x-auto border border-white/10 min-h-[160px] text-white">
                      {selectedSchemaJson || "// Select a method to view schema"}
                    </pre>
                  </div>
                </div>

                <Button
                  onClick={runTool}
                  disabled={!agentReady || !selectedEndpoint || !selectedMethod || isExecuting}
                  className="mt-6 px-8 h-12 text-base font-medium modern-button-primary"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isExecuting ? "Executing..." : "Execute API Call"}
                </Button>
              </Card>

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
                        <p className="text-sm">Select a method, fill params, and execute.</p>
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
                              <pre className="text-xs bg-black/30 p-3 rounded-lg font-mono overflow-x-auto border border-white/10">
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
