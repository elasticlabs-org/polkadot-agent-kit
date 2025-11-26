"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, Code2, Terminal, ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { useAgentStore, useIsInitialized } from "@/stores/agent-store"

interface SidebarProps {
  currentPage: "config" | "chat" | "developer"
}

interface AgentConfig {
  isConfigured: boolean
}

export default function Sidebar({ currentPage }: SidebarProps) {
  const router = useRouter()
  const isInitialized = useIsInitialized()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigateTo = (page: string) => {
    if (page === "config") {
      router.push("/config")
    } else if (page === "chat" && isInitialized) {
      router.push("/chat")
    } else if (page === "developer" && isInitialized) {
      router.push("/developer")
    }
  }

  return (
    <div className={`${sidebarCollapsed ? "w-16" : "w-80"} transition-all duration-300 modern-sidebar`}>
      <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} p-4 sm:p-6 border-b border-white/10 h-[73px] sm:h-[89px]`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-bold text-xl modern-gradient-text">Polkadot Agent Kit</h1>
              <p className="text-xs modern-text-secondary">Playground v2.1.4</p>
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
          className={`w-full ${sidebarCollapsed ? "justify-center" : "justify-start gap-3"} h-12 modern-nav-item ${currentPage === "config" ? "active" : ""}`}
          onClick={() => navigateTo("config")}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">Configuration</span>}
        </Button>

        <Button
          variant="ghost"
          className={`w-full ${sidebarCollapsed ? "justify-center" : "justify-start gap-3"} h-12 modern-nav-item ${currentPage === "chat" ? "active" : ""} ${!isInitialized ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => navigateTo("chat")}
          disabled={!isInitialized}
        >
          <MessageCircle className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">AI Chat</span>}
        </Button>

        <Button
          variant="ghost"
          className={`w-full ${sidebarCollapsed ? "justify-center" : "justify-start gap-3"} h-12 modern-nav-item ${currentPage === "developer" ? "active" : ""} ${!isInitialized ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => navigateTo("developer")}
          disabled={!isInitialized}
        >
          <Code2 className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">Developer Portal</span>}
        </Button>
      </div>
    </div>
  )
}
