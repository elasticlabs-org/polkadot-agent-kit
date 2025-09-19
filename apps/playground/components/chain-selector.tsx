"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Chain {
  id: string
  name: string
  specName: string
  type: "system" | "relay" | "para"
  symbol: string
  relay: string | null
  chainId: number | null
}

interface ChainSelectorProps {
  selectedChains: string[]
  onChainsChange: (chains: string[]) => void
  availableChains: Chain[]
  disabled?: boolean
}

export function ChainSelector({ selectedChains, onChainsChange, availableChains, disabled }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const filteredChains = useMemo(() => {
    console.log('Filtering chains. Available:', availableChains.length, 'Search:', searchQuery)
    if (!searchQuery) return availableChains
    
    const query = searchQuery.toLowerCase()
    const filtered = availableChains.filter(chain => 
      chain.name.toLowerCase().includes(query) ||
      chain.id.toLowerCase().includes(query) ||
      chain.symbol.toLowerCase().includes(query) ||
      (chain.chainId && chain.chainId.toString().includes(query))
    )
    console.log('Filtered chains:', filtered.length)
    return filtered
  }, [availableChains, searchQuery])

  const selectedChainObjects = useMemo(() => {
    return availableChains.filter(chain => selectedChains.includes(chain.id))
  }, [availableChains, selectedChains])

  const toggleChain = (chainId: string) => {
    console.log('Toggling chain:', chainId, 'Current selected:', selectedChains)
    if (selectedChains.includes(chainId)) {
      onChainsChange(selectedChains.filter(id => id !== chainId))
    } else {
      onChainsChange([...selectedChains, chainId])
    }
  }

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(-1)
  }, [searchQuery])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < filteredChains.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredChains.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredChains.length) {
          toggleChain(filteredChains[focusedIndex].id)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  const removeChain = (chainId: string) => {
    onChainsChange(selectedChains.filter(id => id !== chainId))
  }

  const getChainTypeColor = (type: string) => {
    switch (type) {
      case "relay": return "bg-blue-900/30 text-blue-400 border-blue-700"
      case "system": return "bg-green-900/30 text-green-400 border-green-700"
      case "para": return "bg-purple-900/30 text-purple-400 border-purple-700"
      default: return "bg-gray-900/30 text-gray-400 border-gray-700"
    }
  }

  const getChainTypeLabel = (type: string) => {
    switch (type) {
      case "relay": return "Relay"
      case "system": return "System"
      case "para": return "Para"
      default: return "Unknown"
    }
  }

  return (
    <div className="relative">
      <label className="text-sm font-semibold mb-3 block modern-text-primary">
        Select Chains
      </label>
      
      {/* Selected Chains Display */}
      {selectedChainObjects.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedChainObjects.map(chain => (
            <Badge
              key={chain.id}
              className={cn("px-3 py-1 text-sm", getChainTypeColor(chain.type))}
            >
              <span className="mr-2">{chain.name}</span>
              <button
                onClick={() => removeChain(chain.id)}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full h-12 justify-between modern-select"
      >
        <span className="text-left">
          {selectedChains.length === 0 
            ? "Choose chains..." 
            : `${selectedChains.length} of ${availableChains.length} chain${availableChains.length === 1 ? '' : 's'} selected`
          }
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 z-50 mt-1 modern-card border border-white/10 rounded-lg shadow-xl backdrop-blur-sm bg-black/95"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, chain ID, or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 modern-input"
                autoFocus
                onKeyDown={handleKeyDown}
              />
            </div>
            {filteredChains.length > 0 && (
              <div className="text-xs text-gray-400 mt-2">
                {filteredChains.length} chain{filteredChains.length === 1 ? '' : 's'} found
              </div>
            )}
          </div>

          {/* Chain List */}
          <div className="max-h-80 overflow-y-auto">
            <div className="p-1">
              {filteredChains.length === 0 ? (
                <div className="text-center py-6 modern-text-secondary">
                  <div className="text-sm">No chains found</div>
                  <div className="text-xs mt-1 opacity-70">Try a different search term</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredChains.map((chain, index) => {
                    const isSelected = selectedChains.includes(chain.id)
                    const isFocused = index === focusedIndex
                    return (
                      <div
                        key={chain.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all duration-150",
                          "hover:bg-white/8 hover:scale-[1.01]",
                          isSelected && "bg-white/12 border border-white/20",
                          isFocused && "bg-white/10 border border-white/15 ring-1 ring-white/20"
                        )}
                        onClick={() => toggleChain(chain.id)}
                      >
                        <div className={cn(
                          "w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0",
                          isSelected 
                            ? "bg-white border-white" 
                            : "border-white/40 hover:border-white/60"
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium modern-text-primary text-sm truncate">
                              {chain.name}
                            </span>
                            <Badge className={cn("text-xs px-1.5 py-0.5 flex-shrink-0", getChainTypeColor(chain.type))}>
                              {getChainTypeLabel(chain.type)}
                            </Badge>
                          </div>
                          <div className="text-xs modern-text-secondary leading-relaxed">
                            <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-xs">
                              {chain.id}
                            </span>
                            {chain.chainId && (
                              <span className="ml-2 text-xs opacity-80">
                                ID: {chain.chainId}
                              </span>
                            )}
                            {chain.relay && (
                              <span className="ml-2 text-xs opacity-80">
                                Relay: {chain.relay}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
