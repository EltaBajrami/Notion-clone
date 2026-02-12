"use client"

import { PageNode } from "@/lib/types"
import { PageRow } from "./page-row"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useState, useEffect } from "react"
import { FileText } from "lucide-react"

interface PageTreeProps {
  pages: PageNode[]
  depth?: number
  sectionId: string
  expandedIds: string[]
  selectedId: string | null
  renamingId: string | null
  onSelect: (pageId: string) => void
  onToggleExpand: (pageId: string) => void
  onAddPage: (parentId: string) => void
  onRename: (pageId: string) => void
  onRenameSave: (pageId: string, newTitle: string) => void
  onRenameCancel: () => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  onMovePage: (pageId: string, targetSectionId: string, targetParentId: string | null, targetIndex: number) => void
}

export function PageTree({
  pages,
  depth = 0,
  sectionId,
  expandedIds,
  selectedId,
  renamingId,
  onSelect,
  onToggleExpand,
  onAddPage,
  onRename,
  onRenameSave,
  onRenameCancel,
  onDuplicate,
  onDelete,
  onMovePage,
}: PageTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [dropMode, setDropMode] = useState<"nest" | "reorder" | null>(null) // Track if we should nest or reorder
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null)
  const [nestingTargetId, setNestingTargetId] = useState<string | null>(null) // Track which page is a valid nesting target
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    })
  )

  // Only enable drag-and-drop after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Track pointer position during drag
  useEffect(() => {
    if (!activeId) {
      setPointerPosition(null)
      return
    }

    const handlePointerMove = (e: PointerEvent) => {
      setPointerPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("pointermove", handlePointerMove)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [activeId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setDropMode(null)
    setNestingTargetId(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over || !pointerPosition) {
      setDropMode(null)
      return
    }

    const overId = over.id as string
    const overPage = pages.find((p) => p.id === overId)
    
    if (!overPage || overPage.id === active.id) {
      setDropMode(null)
      return
    }

    // Get the target row element to check pointer position
    const targetElement = document.querySelector(`[data-page-id="${overId}"]`) as HTMLElement
    if (!targetElement) {
      setDropMode(null)
      return
    }

    const rect = targetElement.getBoundingClientRect()
    const rowHeight = rect.height
    const relativeY = pointerPosition.y - rect.top

    // Check if pointer is in middle 60% of row height
    const top20Percent = rowHeight * 0.2
    const bottom20Percent = rowHeight * 0.8

    if (relativeY >= top20Percent && relativeY <= bottom20Percent) {
      // In middle 60% - nest mode
      setDropMode("nest")
      setNestingTargetId(overId)
    } else {
      // In top or bottom 20% - reorder mode
      setDropMode("reorder")
      setNestingTargetId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    const currentDropMode = dropMode
    setDropMode(null)
    setNestingTargetId(null)

    if (!over || !onMovePage) return

    const activeId = active.id as string
    const overId = over.id as string

    // Prevent dropping onto itself
    if (activeId === overId) {
      return
    }

    // Find the active page
    const activePage = pages.find((p) => p.id === activeId)
    if (!activePage) return

    // Find the over page (could be a page or a drop zone)
    const overPage = pages.find((p) => p.id === overId)
    
    if (!overPage || overPage.id === activeId) {
      return
    }

    // Check if it's a valid drop (not dropping into own descendant)
    function isDescendant(parent: PageNode, childId: string): boolean {
      if (!parent.children) return false
      for (const child of parent.children) {
        if (child.id === childId) return true
        if (child.children && isDescendant(child, childId)) return true
      }
      return false
    }
    
    if (isDescendant(activePage, overId)) {
      return // Can't drop into own descendant
    }

    // Use drop mode to determine behavior
    if (currentDropMode === "nest") {
      // Dropping ON item (middle 60%) - nest inside it
      // Expand the target page if it has children (so user can see the nested item)
      if (overPage.children && overPage.children.length > 0 && !expandedIds.includes(overId)) {
        onToggleExpand(overId)
      }
      
      // Place as LAST child of the target page
      const targetChildrenCount = overPage.children?.length || 0
      onMovePage(activeId, sectionId, overId, targetChildrenCount)
    } else {
      // Dropping BETWEEN items (top/bottom 20%) - reorder
      const activeIndex = pages.findIndex((p) => p.id === activeId)
      let targetIndex = pages.findIndex((p) => p.id === overId)
      
      if (targetIndex === -1) return // Target not found
      
      // Determine if dropping above or below based on pointer position
      const targetElement = document.querySelector(`[data-page-id="${overId}"]`) as HTMLElement
      if (targetElement && pointerPosition) {
        const rect = targetElement.getBoundingClientRect()
        const relativeY = pointerPosition.y - rect.top
        const rowHeight = rect.height
        
        // If in top 20%, insert above; if in bottom 20%, insert below
        if (relativeY < rowHeight * 0.2) {
          // Dropping above - insert at target index
          if (activeIndex < targetIndex) {
            targetIndex -= 1
          }
        } else {
          // Dropping below - insert after target
          if (activeIndex > targetIndex) {
            // No adjustment needed
          } else {
            targetIndex += 1
          }
        }
      } else {
        // Fallback: adjust index if moving within same list
        if (activeIndex < targetIndex) {
          targetIndex -= 1
        }
      }
      
      onMovePage(activeId, sectionId, null, targetIndex)
    }
  }

  // Get all page IDs for sortable context
  const pageIds = pages.map((p) => p.id)

  // Render tree structure without drag-and-drop during SSR
  const treeContent = (
    <div className="space-y-[1px]">
      {pages.map((page) => {
        const hasChildren = page.children && page.children.length > 0
        const isExpanded = expandedIds.includes(page.id)
        const isActive = selectedId === page.id

        return (
          <div key={page.id}>
            <PageRow
              page={page}
              depth={depth}
              sectionId={sectionId}
              isActive={isActive}
              hasChildren={hasChildren}
              isExpanded={isExpanded}
              isRenaming={renamingId === page.id}
              isNestingTarget={nestingTargetId === page.id}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddPage={onAddPage}
              onRename={onRename}
              onRenameSave={onRenameSave}
              onRenameCancel={onRenameCancel}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
            {/* Recursively render children if expanded */}
            {hasChildren && isExpanded && (
              <PageTree
                pages={page.children!}
                depth={depth + 1}
                sectionId={sectionId}
                expandedIds={expandedIds}
                selectedId={selectedId}
                renamingId={renamingId}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onAddPage={onAddPage}
                onRename={onRename}
                onRenameSave={onRenameSave}
                onRenameCancel={onRenameCancel}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onMovePage={onMovePage}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  // Only wrap with DndContext after mount to avoid hydration mismatch
  if (!isMounted) {
    return treeContent
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
        {treeContent}
      </SortableContext>
      <DragOverlay>
        {activeId ? (() => {
          const activePage = pages.find((p) => p.id === activeId)
          if (!activePage) return null
          // Apply translateX(8px) when in nest mode
          const nestTransform = dropMode === "nest" ? "translateX(8px)" : "translateX(0px)"
          return (
            <div 
              className="opacity-80 bg-white border border-neutral-300 rounded shadow-lg" 
              style={{ 
                width: '240px',
                transform: nestTransform,
                transition: 'transform 0.15s ease-out'
              }}
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                {activePage.icon ? (
                  <span className="text-base flex-shrink-0">{activePage.icon}</span>
                ) : (
                  <FileText className="h-4 w-4 text-neutral-700 flex-shrink-0" />
                )}
                <span className="flex-1 text-[14px] font-normal text-neutral-700 truncate">
                  {activePage.title}
                </span>
              </div>
            </div>
          )
        })() : null}
      </DragOverlay>
    </DndContext>
  )
}
