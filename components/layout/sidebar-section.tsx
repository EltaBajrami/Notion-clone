"use client"

import { ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PageNode } from "@/lib/types"
import { SidebarRow } from "./sidebar-row"

interface SidebarSectionProps {
  id: string
  title: string
  pages: PageNode[]
  isCollapsed: boolean
  expandedPages: Set<string>
  selectedPageId: string | null
  onToggle: (sectionId: string) => void
  onAddPage: (sectionId: string) => void
  onSelect: (pageId: string) => void
  onToggleExpand: (pageId: string) => void
  onRename: (pageId: string, newTitle: string) => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  onAddPageToParent: (parentId?: string) => void
}

export function SidebarSection({
  id,
  title,
  pages,
  isCollapsed,
  expandedPages,
  selectedPageId,
  onToggle,
  onAddPage,
  onSelect,
  onToggleExpand,
  onRename,
  onDuplicate,
  onDelete,
  onAddPageToParent,
}: SidebarSectionProps) {

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-2 py-1.5 group">
        <button
          onClick={() => onToggle(id)}
          className="flex items-center gap-1.5 flex-1 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-text-muted transition-transform duration-150",
              isCollapsed && "-rotate-90"
            )}
          />
          {title}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onAddPage(id)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {!isCollapsed && (
        <div className="px-1">
          {pages.map((page) => (
            <SidebarRow
              key={page.id}
              page={page}
              level={0}
              isSelected={selectedPageId === page.id}
              isExpanded={expandedPages.has(page.id)}
              expandedPages={expandedPages}
              selectedPageId={selectedPageId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onAddPage={onAddPageToParent}
            />
          ))}
        </div>
      )}
    </div>
  )
}
