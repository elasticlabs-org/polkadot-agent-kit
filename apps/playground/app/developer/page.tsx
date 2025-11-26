"use client"

import { useEffect, useMemo, useState } from "react"
import Sidebar from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Play, Zap, Terminal, X, Loader2 } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useAgentStore, useAgentRestore } from "@/stores/agent-store"

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
  const { agentKit, isInitialized, config } = useAgentStore()
  const [toolsMap, setToolsMap] = useState<ToolsMap | null>(null)

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointKey | "">("")
  const [selectedMethod, setSelectedMethod] = useState("")
  const [toolParams, setToolParams] = useState("{}")
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [parsedSchema, setParsedSchema] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Restore agent session on page load
  useAgentRestore()

  // Initialize tools when agentKit is available
  useEffect(() => {
    const initializeTools = async () => {
      if (!agentKit || !isInitialized) {
        setToolsMap(null)
        return
      }

      try {
        const { default: zodToJsonSchema } = await import("zod-to-json-schema")
        const ep: ToolsMap = {
          assets: {
            getNativeBalanceTool: agentKit.getNativeBalanceTool(),
            transferNativeTool: agentKit.transferNativeTool(),
            xcmTransferNativeTool: agentKit.xcmTransferNativeTool(),
          },
          swap: {
            swapTokensTool: agentKit.swapTokensTool(),
          },
          bifrost: {
            mintVdotTool: agentKit.mintVdotTool(),
          },
          staking: {
            joinPoolTool: agentKit.joinPoolTool(),
            bondExtraTool: agentKit.bondExtraTool(),
            unbondTool: agentKit.unbondTool(),
            withdrawUnbondedTool: agentKit.withdrawUnbondedTool(),
            claimRewardsTool: agentKit.claimRewardsTool(),
          },


        }

        // Process each tool to add schema information
        for (const [endpoint, tools] of Object.entries(ep)) {
          for (const [methodName, tool] of Object.entries(tools)) {
            try {
              const fullSchema = zodToJsonSchema(tool.schema, methodName) as any
              let schemaJson

              if (fullSchema?.$ref && fullSchema?.definitions) {
                const refName = fullSchema.$ref.replace('#/definitions/', '')
                schemaJson = fullSchema.definitions[refName] || fullSchema
              } else {
                schemaJson = fullSchema
              }

              // Add schema information to the tool
              ;(tool as any).schemaJson = schemaJson
              ;(tool as any).name = methodName
              ;(tool as any).description = tool.description || `${methodName} tool`
            } catch (error) {
              console.warn(`Failed to process schema for ${methodName}:`, error)
            }
          }
        }

        setToolsMap(ep)
      } catch (error) {
        console.error("Failed to initialize tools:", error)
        setToolsMap(null)
      }
    }

    initializeTools()
  }, [agentKit])

  const selectedTool = useMemo(() => {
    if (!selectedEndpoint || !selectedMethod || !toolsMap) return null
    return toolsMap[selectedEndpoint][selectedMethod]
  }, [selectedEndpoint, selectedMethod, toolsMap])

  const selectedSchemaJson = useMemo(() => {
    const sj = (selectedTool as any)?.schemaJson
    return sj ? JSON.stringify(sj, null, 2) : ""
  }, [selectedTool])

  // This useEffect handles parsing the schema and initializing the form data
  // when a tool is selected.
  useEffect(() => {
    const schemaObj = (selectedTool as any)?.schemaJson
    if (schemaObj && typeof schemaObj === 'object') {
      try {
        setParsedSchema(schemaObj)

        // Initialize form data with default values from the new schema
        const initialFormData: Record<string, any> = {}
        if (schemaObj.properties) {
          for (const [key, prop] of Object.entries(schemaObj.properties as Record<string, any>)) {
            initialFormData[key] = prop.default ?? ""
          }
        }
        setFormData(initialFormData)
      } catch (e) {
        console.error("Failed to process schema:", e)
        setParsedSchema(null)
        setFormData({})
      }
    } else {
      setParsedSchema(null)
      setFormData({})
    }
  }, [selectedTool])

  const methodOptions = useMemo(() => {
    if (!selectedEndpoint || !toolsMap) return []
    return Object.keys(toolsMap[selectedEndpoint] || {})
  }, [selectedEndpoint, toolsMap])

  // This function will render the correct input field based on the schema property type.
  const renderParameterInput = (key: string, prop: any) => {
    const handleInputChange = (value: any) => {
      setFormData(prev => ({ ...prev, [key]: value }))
    }

    // If the property is an enum, render a dropdown select.
    if (prop.enum) {
      return (
        <Select onValueChange={handleInputChange} value={formData[key]}>
          <SelectTrigger className="modern-select">
            <SelectValue placeholder={`Select ${prop.description || key}...`} />
          </SelectTrigger>
          <SelectContent>
            {prop.enum.map((option: string) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Render a standard text input for other types.
    return (
      <Input
        placeholder={prop.description || key}
        value={formData[key] || ""}
        onChange={e => handleInputChange(e.target.value)}
        className="modern-input"
      />
    )
  }

  const runTool = async (params: Record<string, any>) => {
    if (!selectedTool || isExecuting) return
    setIsExecuting(true)
    const id = String(Date.now())
    setToolCalls(prev => [...prev, { id, tool: selectedEndpoint || "", method: selectedMethod, params: JSON.stringify(params, null, 2), status: "pending" }])
    try {
      console.log("[Developer] Executing:", { endpoint: selectedEndpoint, method: selectedMethod, params: params })
      const res = await (selectedTool as any).call(params)
      console.log("[Developer] Response:", res)
      setToolCalls(prev => prev.map(c => c.id === id ? { ...c, status: "success", response: JSON.stringify(res, null, 2) } : c))
    } catch (err: any) {
      setToolCalls(prev => prev.map(c => c.id === id ? { ...c, status: "error", response: String(err?.message || err) } : c))
    } finally {
      setIsExecuting(false)
    }
  }

  const removeToolCall = (id: string) => {
    setToolCalls(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="modern-container min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar currentPage="developer" />

        <div className="flex-1 flex flex-col min-h-screen">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none flex-shrink-0">
            <div className="flex items-center justify-between p-4 sm:p-6 h-[73px] sm:h-[89px]">
              <div className="flex items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold modern-text-primary">Developer Portal</h2>
                <Badge className="modern-badge font-medium px-3 py-1">Tools</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`px-3 py-1 ${isInitialized ? "modern-badge" : "bg-red-900/30 text-red-400 border-red-700"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${isInitialized ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                  {isInitialized ? "Agent Ready" : "Configuration Required"}
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

                <div className="space-y-4">
                  {/* Step 1: Select API Endpoint */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold block modern-text-primary">Select API Endpoint</label>
                    <Select value={selectedEndpoint} onValueChange={(v) => { setSelectedEndpoint(v as EndpointKey); setSelectedMethod(""); setParsedSchema(null); setFormData({}); }}>
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

                  {/* Step 2: Select Method (appears after endpoint is selected) */}
                  {selectedEndpoint && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold block modern-text-primary">Method</label>
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
                  )}

                  {/* Step 3: Dynamically Generated Parameters */}
                  {selectedMethod && parsedSchema?.properties && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <h3 className="text-md font-semibold">Parameters</h3>
                      {Object.entries(parsedSchema.properties).map(([key, prop]: [string, any]) => (
                        <Collapsible key={key} defaultOpen className="space-y-2">
                          <CollapsibleTrigger className="flex justify-between items-center w-full text-left">
                            <label className="text-sm font-semibold flex items-center gap-2">
                              {key}
                              <span className="text-xs font-mono text-gray-400">({prop.type})</span>
                            </label>
                            <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2">
                            {prop.description && <p className="text-xs text-gray-400">{prop.description}</p>}
                            {renderParameterInput(key, prop)}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}

                  {/* Execute Button */}
                  <div className="pt-4 border-t border-white/10">
                    <Button
                      onClick={() => runTool(formData)}
                      disabled={!isInitialized || !selectedEndpoint || !selectedMethod || isExecuting}
                      className="w-full modern-button-primary"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Execute API Call
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {toolCalls.length === 0 ? (
                <Card className="p-3 sm:p-4 lg:p-6 modern-card">
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 modern-text-primary">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  API Response
                </h3>
                  <div className="flex flex-col items-center justify-center h-[100px] sm:h-[125px] lg:h-[150px] text-center modern-text-secondary">
                    <Terminal className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-2 sm:mb-3 opacity-30" />
                    <p className="text-xs sm:text-sm lg:text-base mb-1">No API calls executed yet</p>
                    <p className="text-xs opacity-70">Select a method, fill params, and execute.</p>
                      </div>
                </Card>
                    ) : (
                      toolCalls.map((call) => (
                  <Card key={call.id} className="p-3 sm:p-4 lg:p-6 modern-card">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 modern-text-primary">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                        API Response
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className="modern-badge font-medium text-xs">{call.tool}</Badge>
                        <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded-lg text-white">
                                {call.method}
                              </span>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeToolCall(call.id)}
                              className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                              title="Remove this API call"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                            </div>

                          {call.response && (
                      <div className="h-[100px] sm:h-[125px] lg:h-[150px] overflow-y-auto border border-white/10 rounded-lg bg-black/20">
                        <div className="p-2 sm:p-3 lg:p-4">
                              <div className="text-xs font-semibold mb-2 modern-text-primary">Response:</div>
                          <div className="bg-black/40 rounded border border-white/20 overflow-hidden">
                            <pre className="text-xs font-mono p-2 overflow-x-auto whitespace-pre-wrap break-words text-white leading-relaxed">
                                {call.response}
                              </pre>
                          </div>
                        </div>
                            </div>
                          )}

                          {call.status === "pending" && (
                      <div className="flex items-center justify-center h-[100px] sm:h-[125px] lg:h-[150px] gap-2 text-sm modern-text-secondary">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Executing API call...
                            </div>
                          )}
                  </Card>
                      ))
                    )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}