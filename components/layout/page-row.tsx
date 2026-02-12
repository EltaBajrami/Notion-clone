"use client"

import { ChevronRight, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageNode } from "@/lib/types"
import { INDENT_SIZE } from "@/lib/tokens"
import { cn, getDisplayTitle } from "@/lib/utils"
import { PageMenu } from "./page-menu"
import { RenameInput } from "./rename-input"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable, useDndContext } from "@dnd-kit/core"
import { useEffect, useState } from "react"

interface PageRowProps {
  page: PageNode
  depth: number
  sectionId: string
  isActive?: boolean
  hasChildren?: boolean
  isExpanded?: boolean
  isRenaming?: boolean
  isNestingTarget?: boolean
  onSelect: (pageId: string) => void
  onToggleExpand: (pageId: string) => void
  onAddPage: (parentId: string) => void
  onRename: (pageId: string) => void
  onRenameSave: (pageId: string, newTitle: string) => void
  onRenameCancel: () => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
}

export function PageRow({
  page,
  depth,
  sectionId,
  isActive = false,
  hasChildren = false,
  isExpanded = false,
  isRenaming = false,
  isNestingTarget = false,
  onSelect,
  onToggleExpand,
  onAddPage,
  onRename,
  onRenameSave,
  onRenameCancel,
  onDuplicate,
  onDelete,
}: PageRowProps) {
  const indentStyle = depth > 0 ? { paddingLeft: `${depth * INDENT_SIZE}px` } : {}
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Make the row draggable (only after mount to avoid hydration issues)
  const sortable = useSortable({
    id: page.id,
    disabled: isRenaming || !isMounted, // Disable dragging while renaming or during SSR
  })

  // Make the row a drop zone (for nesting)
  const droppable = useDroppable({
    id: page.id,
    disabled: isRenaming || sortable.isDragging || !isMounted,
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable

  const { setNodeRef: setDropRef, isOver } = droppable
  const { active } = useDndContext()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Check if the item being dragged over is a valid nesting target
  // (not the same item, and not a descendant)
  const isValidNestingTarget = isOver && active && active.id !== page.id && !isDragging

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    setDropRef(node)
  }

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't select if renaming (input handles its own clicks)
    if (isRenaming) {
      e.stopPropagation()
      return
    }
    // Don't select if dragging
    if (isDragging) {
      e.stopPropagation()
      return
    }
    // Select the row (chevron click is stopped via stopPropagation)
    onSelect(page.id)
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row selection when clicking chevron
    onToggleExpand(page.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle keyboard if renaming (input handles its own)
    if (isRenaming) {
      e.stopPropagation()
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      onSelect(page.id)
    }
  }

  const handleChevronKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation() // Prevent row selection
      onToggleExpand(page.id)
    }
  }

  const handleAddPageClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row selection
    onAddPage(page.id)
  }

  return (
    <div
      ref={combinedRef}
      data-page-id={page.id}
      style={{
        ...indentStyle,
        ...style,
        height: "30px", // Notion row height
        minHeight: "27px", // Notion min-height
        position: "relative", // For absolute positioning of nesting indicator
      }}
      className={cn(
        "group flex items-center",
        "py-[5px] px-[8px]", // Notion padding: 5px top/bottom, 8px left/right
        "rounded-[6px]", // Notion border radius
        "cursor-pointer",
        "transition-all duration-150", // 150ms transition for all properties
        // Hover state - subtle background
        !isActive && "hover:bg-neutral-100",
        // Selected/active state - Notion-like selected background
        isActive && "bg-[rgba(0,0,0,0.04)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
        // Focus state
        "focus:outline-none",
        isActive && "focus-visible:shadow-[inset_0_0_0_1px_rgba(35,131,226,0.35),0_0_0_2px_rgba(35,131,226,0.25)]",
        // Nesting target state
        isValidNestingTarget && !isDragging && "bg-blue-50",
        isDragging && "z-50 opacity-50"
      )}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={getDisplayTitle(page.title)}
      aria-pressed={isActive}
      suppressHydrationWarning
      {...attributes}
      {...listeners}
    >
      {/* Nesting indicator - shows when item is being dragged over this row */}
      {isValidNestingTarget && !isDragging && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
      )}
      
      {/* Inset line indicator - shows when this is a valid nesting target */}
      {isNestingTarget && (
        <div 
          className="absolute inset-x-0 border-t-2 border-blue-500 pointer-events-none"
          style={{ 
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: `${(depth + 1) * 18}px`, // Indent based on depth
            marginRight: '8px'
          }}
        />
      )}

      {/* Icon slot: 22px wide, centered, 8px gap to text */}
      <div className="w-[22px] h-[18px] flex items-center justify-center flex-shrink-0 mr-[8px]">
        {/* Chevron for expandable rows - overlays icon on hover */}
      {hasChildren ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Icon - hides on hover when has children */}
            <div className="group-hover:opacity-0 transition-opacity duration-150 absolute inset-0 flex items-center justify-center">
              {page.icon ? (
                <span className="text-[18px] leading-none" aria-hidden="true">
                  {page.icon}
                </span>
              ) : (
                <FileText className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
              )}
            </div>
            {/* Chevron - shows on hover */}
        <button
          onClick={handleChevronClick}
          onKeyDown={handleChevronKeyDown}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute inset-0 flex items-center justify-center hover:bg-neutral-200/60 rounded focus:outline-none"
          tabIndex={0}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
              {...(!isRenaming && !isDragging ? {} : { style: { pointerEvents: 'none' } })}
        >
          <ChevronRight
            className={cn(
                  "h-3 w-3 text-neutral-500 transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        </button>
          </div>
        ) : (
          // No children - just show icon
          page.icon ? (
            <span className="text-[18px] leading-none" aria-hidden="true">
          {page.icon}
        </span>
      ) : (
            <FileText className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
          )
      )}
      </div>

      {/* Title with truncation or rename input - font-size 14px, font-weight 500 */}
      {isRenaming ? (
        <RenameInput
          initialValue={page.title}
          onSave={(newTitle) => onRenameSave(page.id, newTitle)}
          onCancel={onRenameCancel}
          className="flex-1 min-w-0"
        />
      ) : (
        <span
          className="flex-1 text-[14px] font-medium text-neutral-700 truncate min-w-0"
          title={getDisplayTitle(page.title)}
        >
          {getDisplayTitle(page.title)}
        </span>
      )}

      {/* Right-side actions area - fade in on hover */}
      <div 
        className={cn(
          "flex items-center gap-[2px] flex-shrink-0 ml-auto",
          "opacity-0 invisible pointer-events-none",
          "group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto",
          "group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto",
          "transition-[opacity,visibility] duration-150 ease-in-out"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Context menu (... button) */}
        <PageMenu
          pageId={page.id}
          pageTitle={getDisplayTitle(page.title)}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />

        {/* Add page button (+) */}
        <button
          onClick={handleAddPageClick}
          className="h-[20px] w-[20px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(55,53,47,0.08)] focus:outline-none transition-colors duration-100"
          aria-label={`Add page to ${getDisplayTitle(page.title)}`}
        >
          <Plus className="h-[14px] w-[14px] text-[rgba(55,53,47,0.5)]" />
        </button>
      </div>
    </div>
  )
}
