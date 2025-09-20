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

  useEffect(() => {
    const init = async () => {
      try {
        const raw = localStorage.getItem("polkadot-agent-config")
        if (!raw) return
        const cfg = JSON.parse(raw) as AgentConfigLocal

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
    if (!selectedTool) return
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
    }
  }

  return (
    <div className="modern-container min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar currentPage="developer" />

        <div className="flex-1 flex flex-col min-h-screen">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none flex-shrink-0">
            <div className="flex items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold modern-text-primary">Developer Portal</h2>
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

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-8">
              <Card className="p-4 sm:p-6 modern-card">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-3 modern-text-primary">
                  <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
                  Polkadot API Tools
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="col-span-1">
                    <label className="text-sm font-semibold mb-3 block modern-text-primary">Select API Endpoint</label>
                    <Select value={selectedEndpoint} onValueChange={(v) => { setSelectedEndpoint(v as EndpointKey); setSelectedMethod(""); }}>
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

                <div className="mt-3 sm:mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 sm:mb-3 block modern-text-primary">Parameters (JSON)</label>
                    <Textarea
                      className="font-mono text-xs sm:text-sm modern-input min-h-[100px] sm:min-h-[120px]"
                      value={toolParams}
                      onChange={(e) => setToolParams(e.target.value)}
                      placeholder="{}"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 sm:mb-3 block modern-text-primary">Schema (readonly)</label>
                    <pre className="text-xs bg-black/30 p-2 sm:p-3 rounded-lg font-mono overflow-x-auto border border-white/10 min-h-[100px] sm:min-h-[120px] text-white leading-relaxed">
                      {selectedSchemaJson || "// Select a method to view schema"}
                    </pre>
                  </div>
                </div>

                <Button
                  onClick={runTool}
                  disabled={!agentReady || !selectedEndpoint || !selectedMethod}
                  className="mt-4 sm:mt-6 px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium modern-button-primary w-full sm:w-auto"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Execute API Call
                </Button>
              </Card>

              <Card className="p-3 sm:p-4 lg:p-6 modern-card">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 modern-text-primary">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  API Response
                </h3>

                <div className="h-[100px] sm:h-[125px] lg:h-[150px] overflow-y-auto border border-white/10 rounded-lg bg-black/20">
                  <div className="p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3">
                    {toolCalls.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center modern-text-secondary">
                        <Terminal className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-2 sm:mb-3 opacity-30" />
                        <p className="text-xs sm:text-sm lg:text-base mb-1">No API calls executed yet</p>
                        <p className="text-xs opacity-70">Select a method, fill params, and execute.</p>
                      </div>
                    ) : (
                      toolCalls.map((call) => (
                        <div key={call.id} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="modern-badge font-medium text-xs">{call.tool}</Badge>
                              <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded-lg text-white">
                                {call.method}
                              </span>
                            </div>
                            <Badge
                              className={
                                call.status === "success"
                                  ? "bg-green-900/30 text-green-400 border-green-700 text-xs"
                                  : call.status === "error"
                                    ? "bg-red-900/30 text-red-400 border-red-700 text-xs"
                                    : "bg-white/10 text-white border-white/20 text-xs"
                              }
                            >
                              {call.status}
                            </Badge>
                          </div>

                          {call.params && (
                            <div className="mb-2 sm:mb-3">
                              <div className="text-xs font-semibold mb-1 modern-text-primary">Parameters:</div>
                              <div className="bg-black/40 rounded border border-white/20 overflow-hidden">
                                <pre className="text-xs font-mono p-2 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed text-white">
                                  {call.params}
                                </pre>
                              </div>
                            </div>
                          )}

                          {call.response && (
                            <div>
                              <div className="text-xs font-semibold mb-1 modern-text-primary">Response:</div>
                              <div className="bg-black/40 rounded border border-white/20 overflow-hidden">
                                <pre className="text-xs font-mono p-2 overflow-x-auto whitespace-pre-wrap break-words text-white leading-relaxed max-h-32 overflow-y-auto">
                                  {call.response}
                                </pre>
                              </div>
                            </div>
                          )}

                          {call.status === "pending" && (
                            <div className="flex items-center gap-2 text-sm modern-text-secondary">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Executing API call...
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}