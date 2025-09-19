"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot } from "lucide-react"
import Sidebar from "@/components/sidebar"


interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
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

export default function ChatPage() {
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [isClient, setIsClient] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Initialize client-side state and load config
  useEffect(() => {
    setIsClient(true)
    

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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !agentConfig?.isConfigured) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsLoading(true)

    try {
      // Dynamic import to avoid SSR issues
      const { AgentService } = await import("@/services/agent")
      const agent = AgentService.getInstance()
      const result = await agent.ask(userMessage.content)
      const outputText = typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: outputText,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `Error: ${err?.message || "Unknown error"}`,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="modern-container">
        <div className="flex h-screen">
          <Sidebar currentPage="chat" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="modern-text-secondary">Loading chat...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container">
      <div className="flex h-screen">
        <Sidebar currentPage="chat" />

        <div className="flex-1 flex flex-col">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold modern-text-primary">AI Chat Interface</h2>
                <Badge className="modern-badge font-medium px-3 py-1">Interactive</Badge>
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

          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-4xl mx-auto">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-5 ${
                        message.type === "user" ? "modern-button-primary ml-12" : "modern-card mr-12"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {message.type === "ai" && (
                          <div className="w-8 h-8 rounded-lg modern-logo flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                          <div className="text-xs opacity-60 mt-3 font-mono">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="modern-card rounded-2xl p-5 mr-12">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg modern-logo flex items-center justify-center animate-pulse">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-white/10 modern-card border-l-0 border-r-0 border-b-0 rounded-none p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-4">
                  <Textarea
                    placeholder={
                      agentConfig?.isConfigured
                        ? "Ask me about Polkadot, XCM, Substrate, or any Web3 topic..."
                        : "Please configure the agent first..."
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 min-h-[70px] resize-none modern-input text-base"
                    disabled={!agentConfig?.isConfigured}
                    onKeyDown={(e) => {
                      const ne = (e as any).nativeEvent
                      if (ne?.isComposing || e.keyCode === 229) return
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    onCompositionStart={() => {/* optional: set state if you want */}}
                    onCompositionEnd={() => {/* optional: clear state */}}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isLoading || !agentConfig?.isConfigured}
                    className="px-8 h-[70px] modern-button-primary text-base font-medium"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
