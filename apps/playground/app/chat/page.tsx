"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot } from "lucide-react"
import Sidebar from "@/components/sidebar"
import { useAgentStore, useAgentRestore, useIsInitialized } from "@/stores/agent-store"
import { ASSETS_PROMPT, XCM_PROMPT } from "@polkadot-agent-kit/llm"
import { SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages"

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
  const { agentKit, config } = useAgentStore()
  const isInitialized = useIsInitialized()
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Restore agent session on page load
  useAgentRestore()

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !isInitialized || !agentKit) return

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
      const { getLangChainTools } = await import("@polkadot-agent-kit/sdk")
      const { ChatOllama } = await import("@langchain/ollama")

      // Get LLM config from localStorage
      const llmConfig = localStorage.getItem("llm_config")
      if (!llmConfig) throw new Error("LLM configuration not found")

      const { provider, model, apiKey: storedApiKey } = JSON.parse(llmConfig)

      let chatModel: any
      if (provider === "ollama") {
        chatModel = new ChatOllama({
          model: model || "qwen3:latest",
          temperature: 0,
        })
      } else if (provider === "openai") {
        // Dynamically load OpenAI client for browser use
        const { ChatOpenAI } = await import("@langchain/openai")
        const apiKey = storedApiKey || process.env.NEXT_PUBLIC_OPENAI_KEY
        if (!apiKey) throw new Error("OpenAI API key not found. Provide it or set NEXT_PUBLIC_OPENAI_KEY.")
        chatModel = new ChatOpenAI({
          model: model || "gpt-4o-mini",
          temperature: 0,
          apiKey,
        })
      } else if (provider === "gemini") {
        const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai")
        const apiKey = storedApiKey || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        if (!apiKey) throw new Error("Google Generative AI API key not found. Set it in config or NEXT_PUBLIC_GOOGLE_API_KEY.")
        chatModel = new ChatGoogleGenerativeAI({
          model: model || "gemini-2.0-flash",
          temperature: 0,
          apiKey,
        })
      } else {
        throw new Error(`Unsupported LLM provider: ${provider}`)
      }

      const tools = getLangChainTools(agentKit)
      const modelWithTools = chatModel.bindTools(tools)

      const messages = [
        new SystemMessage({ content: ASSETS_PROMPT + XCM_PROMPT }),
        new HumanMessage({ content: userMessage.content }),
      ]

      const aiResponse = await modelWithTools.invoke(messages)

      let outputText = ""

      if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {

  
        // Execute all tools and collect results
        const toolMessages: ToolMessage[] = []
        
        for (const toolCall of aiResponse.tool_calls) {
          const selectedTool = tools.find((t) => t.name === toolCall.name)
          if (selectedTool) {
            try {
              console.log(`Executing tool ${toolCall.name} with args:`, toolCall.args)
              const toolResult = await selectedTool.invoke(toolCall.args)
              console.log(`Tool result (${toolCall.name}):`, toolResult)
              
              // Create a ToolMessage with the result
              toolMessages.push(
                new ToolMessage({
                  content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
                  tool_call_id: toolCall.id || toolCall.name,
                })
              )
            } catch (error) {
              console.error(`Error executing tool ${toolCall.name}:`, error)
              toolMessages.push(
                new ToolMessage({
                  content: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  tool_call_id: toolCall.id || toolCall.name,
                })
              )
            }
          } else {
            toolMessages.push(
              new ToolMessage({
                content: `Error: Tool ${toolCall.name} not found`,
                tool_call_id: toolCall.id || toolCall.name,
              })
            )
          }
        }
        
        const messagesWithToolResults = [
          ...messages,
          aiResponse,
          ...toolMessages,
        ]
        
        const finalResponse = await chatModel.invoke(messagesWithToolResults)
        
        outputText = typeof finalResponse.content === "string" 
          ? finalResponse.content 
          : JSON.stringify(finalResponse.content, null, 2)
      } else {
        outputText = typeof aiResponse.content === "string" 
          ? aiResponse.content 
          : JSON.stringify(aiResponse.content, null, 2)
      }

      outputText = outputText.replace(/<think>[\s\S]*?<\/think>/g, "").trim()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: outputText || "No response generated.",
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

        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-white/10 modern-card border-l-0 border-r-0 border-t-0 rounded-none flex-shrink-0">
            <div className="flex items-center justify-between p-4 sm:p-6 h-[73px] sm:h-[89px]">
              <div className="flex items-center gap-2 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold modern-text-primary">AI Chat Interface</h2>
                <Badge className="modern-badge font-medium px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm">Interactive</Badge>
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

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-xl sm:rounded-2xl p-3 sm:p-5 ${message.type === "user"
                          ? "bg-blue-600/20 border border-blue-500/30 ml-4 sm:ml-12"
                          : "modern-card mr-4 sm:mr-12"
                        }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-4">
                        {message.type === "ai" && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg modern-logo flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">{message.content}</div>
                          <div className="text-xs opacity-60 mt-2 sm:mt-3 font-mono">
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
            </div>

            <div className="border-t border-white/10 modern-card border-l-0 border-r-0 border-b-0 rounded-none p-4 sm:p-6">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Textarea
                    placeholder={
                      isInitialized
                        ? "Press Enter to send, Shift+Enter for new line)"
                        : "Please configure the agent first..."
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full min-h-[60px] sm:min-h-[70px] resize-none modern-input text-sm sm:text-base pr-4"
                    disabled={!isInitialized}
                    onKeyDown={(e) => {
                      const ne = (e as any).nativeEvent
                      if (ne?.isComposing || e.keyCode === 229) return
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    onCompositionStart={() => {/* optional: set state if you want */ }}
                    onCompositionEnd={() => {/* optional: clear state */ }}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
