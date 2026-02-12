"use client"

import {
  Search,
  Home,
  Video,
  Sparkles,
  Inbox,
  ChevronDown,
  Mail,
  Calendar,
  Monitor,
  HelpCircle,
} from "lucide-react"
import { SIDEBAR_WIDTH } from "@/lib/tokens"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

interface NotionSidebarProps {
  selectedId: string | null
  onSelect: (id: string) => void
  workspaceName?: string
}

export function NotionSidebar({
  selectedId,
  onSelect,
  workspaceName = "Workspace",
}: NotionSidebarProps) {
  // Primary navigation items
  const primaryNav: NavItem[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "meetings", label: "Meetings", icon: Video },
    { id: "notion-ai", label: "Notion AI", icon: Sparkles },
    { id: "inbox", label: "Inbox", icon: Inbox },
  ]

  // Private section items
  const privateItems: NavItem[] = [
    { id: "getting-started", label: "Getting Started", icon: Home },
    { id: "task-list", label: "Task List", icon: Home },
    { id: "quick-note", label: "Quick Note", icon: Home },
    { id: "reading-list", label: "Reading List", icon: Home },
    { id: "journal", label: "Journal", icon: Home },
    { id: "personal-home", label: "Personal Home", icon: Home },
  ]

  // Notion apps
  const notionApps: NavItem[] = [
    { id: "notion-mail", label: "Notion Mail", icon: Mail },
    { id: "notion-calendar", label: "Notion Calendar", icon: Calendar },
    { id: "notion-desktop", label: "Notion Desktop", icon: Monitor },
  ]

  const renderNavItem = (item: NavItem, isSelected: boolean) => {
    const Icon = item.icon
    return (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-[3px] text-[14px] transition-colors duration-150",
          "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset",
          isSelected
            ? "bg-gray-200 text-gray-900 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", isSelected ? "text-gray-900" : "text-gray-600")} />
        <span className="truncate">{item.label}</span>
      </button>
    )
  }

  return (
    <div
      className="h-full bg-[#F7F6F3] border-r border-[#E4E4E1] flex flex-col"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {/* Workspace Header */}
      <div className="px-2 py-[10px] border-b border-[#E4E4E1]">
        <button
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-[3px] hover:bg-gray-100 transition-colors duration-150 group"
          onClick={() => onSelect("workspace")}
        >
          <span className="text-[14px] font-medium text-gray-900">{workspaceName}</span>
          <ChevronDown className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Search Row */}
      <div className="px-2 py-[6px] border-b border-[#E4E4E1]">
        <button
          onClick={() => onSelect("search")}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[3px] text-[14px] text-gray-500 hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset"
        >
          <Search className="h-4 w-4 text-gray-400" />
          <span>Search</span>
        </button>
      </div>

      {/* Primary Navigation */}
      <div className="px-1 py-[4px]">
        {primaryNav.map((item) => renderNavItem(item, selectedId === item.id))}
      </div>

      {/* Shared Section */}
      <div className="px-1 py-[4px]">
        <div className="px-2 py-1 mb-1">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.03em]">
            Shared
          </div>
        </div>
        {/* Shared items would go here - empty for now */}
      </div>

      {/* Private Section */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-1 py-[4px]">
        <div className="px-2 py-1 mb-1">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.03em]">
            Private
          </div>
        </div>
        <div className="space-y-[2px]">
          {privateItems.map((item) => renderNavItem(item, selectedId === item.id))}
        </div>
      </div>

      {/* Notion Apps Section */}
      <div className="px-1 py-[4px] border-t border-[#E4E4E1]">
        <div className="px-2 py-1 mb-1">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.03em]">
            Notion apps
          </div>
        </div>
        <div className="space-y-[2px]">
          {notionApps.map((item) => renderNavItem(item, selectedId === item.id))}
        </div>
      </div>

      {/* Bottom Help Icon */}
      <div className="px-2 py-2 border-t border-[#E4E4E1]">
        <button
          className="p-1.5 rounded-[3px] hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
