"use client"

import { Search, Home, Video, Sparkles, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SIDEBAR_WIDTH } from "@/lib/tokens"

interface SidebarNavProps {
  selectedId: string | null
  onSelect: (id: string) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
}

export function SidebarNav({
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
}: SidebarNavProps) {
  const topItems = [
    { id: "search", label: "Search", icon: Search },
    { id: "home", label: "Home", icon: Home },
    { id: "meetings", label: "Meetings", icon: Video },
    { id: "notion-ai", label: "Notion AI", icon: Sparkles },
    { id: "inbox", label: "Inbox", icon: Inbox },
  ]

  const sections = [
    { id: "shared", label: "Shared" },
    { id: "private", label: "Private" },
  ]

  return (
    <div
      className="h-full bg-sidebar-bg border-r border-sidebar-divider flex flex-col"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {/* Workspace Header */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[14px] font-semibold text-foreground leading-tight">
              Workspace
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-divider h-[1px]" />

      {/* Top Navigation Items */}
      <div className="px-1 py-2">
        {topItems.map((item) => {
          const Icon = item.icon
          const isActive = selectedId === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded text-[14px] text-foreground
                transition-colors duration-150
                ${isActive ? "bg-sidebar-row-active" : "hover:bg-sidebar-row-hover"}
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <Separator className="bg-sidebar-divider h-[1px]" />

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-2 sidebar-scroll">
        <div className="px-1">
          {sections.map((section) => {
            const isExpanded = expandedIds.has(section.id)
            return (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => onToggleExpand(section.id)}
                  className="w-full px-2 py-1 flex items-center justify-between text-[11px] font-medium text-text-muted uppercase tracking-[0.03em] hover:text-foreground transition-colors"
                >
                  <span>{section.label}</span>
                  <span>{isExpanded ? "−" : "+"}</span>
                </button>
                {/* Section content would go here when expanded */}
              </div>
            )
          })}
        </div>
      </div>

      {/* Notion Apps Section */}
      <div className="p-2 border-t border-sidebar-divider">
        <div className="text-[11px] font-medium text-text-muted uppercase tracking-[0.03em] px-2 py-1">
          Notion apps
        </div>
      </div>
    </div>
  )
}
