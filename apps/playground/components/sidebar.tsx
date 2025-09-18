"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, Code2, Terminal, ChevronLeft, ChevronRight, Settings } from "lucide-react"

interface SidebarProps {
  currentPage: "config" | "chat" | "developer"
}

interface AgentConfig {
  isConfigured: boolean
}

export default function Sidebar({ currentPage }: SidebarProps) {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({ isConfigured: false })

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("polkadot-agent-config")
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      setAgentConfig({ isConfigured: config.isConfigured || false })
    }
  }, [])

  const navigateTo = (page: string) => {
    if (page === "config") {
      router.push("/config")
    } else if (page === "chat" && agentConfig.isConfigured) {
      router.push("/chat")
    } else if (page === "developer" && agentConfig.isConfigured) {
      router.push("/developer")
    }
  }

  return (
    <div className={`${sidebarCollapsed ? "w-16" : "w-80"} transition-all duration-300 modern-sidebar`}>
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 modern-logo flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-xl modern-gradient-text">Polkadot Agent</h1>
              <p className="text-xs modern-text-secondary">Playground v2.0</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 h-12 modern-nav-item ${currentPage === "config" ? "active" : ""}`}
          onClick={() => navigateTo("config")}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">Configuration</span>}
        </Button>

        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 h-12 modern-nav-item ${currentPage === "chat" ? "active" : ""} ${!agentConfig.isConfigured ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => navigateTo("chat")}
          disabled={!agentConfig.isConfigured}
        >
          <MessageCircle className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">AI Chat</span>}
        </Button>

        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 h-12 modern-nav-item ${currentPage === "developer" ? "active" : ""} ${!agentConfig.isConfigured ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => navigateTo("developer")}
          disabled={!agentConfig.isConfigured}
        >
          <Code2 className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">Developer Portal</span>}
        </Button>
      </div>

      {!sidebarCollapsed && (
        <div className="p-4 mt-auto">
          <div className="modern-form-section">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${agentConfig.isConfigured ? "bg-green-400" : "bg-red-400"}`} />
              <span className="modern-text-secondary">
                {agentConfig.isConfigured ? "Agent Configured" : "Configuration Required"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
