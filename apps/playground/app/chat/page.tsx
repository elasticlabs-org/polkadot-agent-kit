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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        'Welcome to the Polkadot Agent Playground!\n\nI\'m your AI assistant for exploring the Polkadot ecosystem. Ready to dive into the world of interoperable blockchains?\n\n**What I can help you with:**\n• Polkadot governance and democracy\n• Cross-chain interoperability with XCM\n• Substrate development guidance\n• Parachain ecosystem insights\n\n**Try asking:**\n- "How does XCM work for cross-chain messaging?"\n- "What are the benefits of Substrate framework?"\n- "Explain Polkadot\'s shared security model"\n- "How do I build a parachain?"',
      timestamp: new Date(),
    },
  ])

  // Load config from localStorage on mount
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !agentConfig?.isConfigured) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Great question about Polkadot! XCM (Cross-Consensus Messaging) enables seamless communication between parachains, allowing them to share functionality and assets while maintaining their specialized purposes.",
        "Substrate is a powerful blockchain framework that provides modular components for building custom blockchains. It handles the complex networking, consensus, and runtime logic so you can focus on your chain's unique features.",
        "Polkadot's shared security model means all parachains benefit from the same level of security as the relay chain, without needing to bootstrap their own validator sets. This is a game-changer for blockchain interoperability.",
        "Building a parachain involves using Substrate to create your runtime logic, then bidding for a parachain slot through the auction system. The process has become much more accessible with tools like Zombienet for testing.",
      ]

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
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
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
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
