"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronRight, Plus, MoreHorizontal, FileText, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { PageNode } from "@/lib/types"

interface SidebarRowProps {
  page: PageNode
  level: number
  isSelected: boolean
  isExpanded: boolean
  expandedPages: Set<string>
  selectedPageId: string | null
  onSelect: (pageId: string) => void
  onToggleExpand: (pageId: string) => void
  onRename: (pageId: string, newTitle: string) => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  onAddPage: (parentId?: string) => void
}

export function SidebarRow({
  page,
  level,
  isSelected,
  isExpanded,
  expandedPages,
  selectedPageId,
  onSelect,
  onToggleExpand,
  onRename,
  onDuplicate,
  onDelete,
  onAddPage,
}: SidebarRowProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(page.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasChildren = page.children && page.children.length > 0

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  useEffect(() => {
    setRenameValue(page.title)
  }, [page.title])

  const handleRename = () => {
    setIsRenaming(true)
    setRenameValue(page.title)
  }

  const handleSaveRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== page.title) {
      onRename(page.id, trimmed)
    } else {
      setRenameValue(page.title)
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setRenameValue(page.title)
    setIsRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveRename()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelRename()
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-sidebar-row-hover cursor-pointer transition-colors duration-150",
          isSelected && "bg-sidebar-row-active",
          level > 0 && "pl-8"
        )}
        onClick={() => {
          onSelect(page.id)
          if (hasChildren) {
            onToggleExpand(page.id)
          }
        }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(page.id)
            }}
            className="p-0.5 hover:bg-sidebar-row-active rounded transition-colors"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-text-muted transition-transform duration-150",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        {page.icon && <span className="text-base flex-shrink-0">{page.icon}</span>}
        {!page.icon && (
          <FileText className="h-4 w-4 text-text-muted flex-shrink-0" />
        )}

        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm text-gray-900 bg-white border border-blue-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        ) : (
          <span
            className="flex-1 text-sm text-foreground truncate"
            onDoubleClick={(e) => {
              e.stopPropagation()
              handleRename()
            }}
          >
            {page.title}
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleRename()}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onDuplicate(page.id)
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onDelete(page.id)
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onAddPage(page.id)
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && page.children && (
        <div className="ml-4">
          {page.children.map((child) => (
            <SidebarRow
              key={child.id}
              page={child}
              level={level + 1}
              isSelected={selectedPageId === child.id}
              isExpanded={expandedPages.has(child.id)}
              expandedPages={expandedPages}
              selectedPageId={selectedPageId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onAddPage={onAddPage}
            />
          ))}
        </div>
      )}
    </div>
  )
}
