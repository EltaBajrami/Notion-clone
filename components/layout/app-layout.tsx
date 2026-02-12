"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"
import { getInitialSidebarData, getDefaultExpandedIds } from "@/lib/mock-data"
import { loadSidebarState, saveSidebarState } from "@/lib/storage"
import {
  addChild,
  renameNode,
  duplicateNode,
  deleteNode,
  findFallbackSelection,
  findPageById,
  findFirstLeafPage,
  updatePageDocument,
  movePage,
} from "@/lib/tree"
import { PageNode, Doc } from "@/lib/types"

/**
 * Main app layout component that owns all application state
 * Manages pages, selection, expansion, and passes state/handlers to Sidebar and MainContent
 */
export function AppLayout() {
  // Start with default state to ensure SSR/client match
  const [state, setState] = useState(() => ({
    pages: getInitialSidebarData(),
    expandedIds: getDefaultExpandedIds(),
    selectedPageId: null as string | null,
    renamingId: null as string | null,
    isHydrated: false,
    shouldFocusTitle: false, // Flag to auto-focus title when new page is created
  }))

  // Load from localStorage only after mount (client-side only)
  useEffect(() => {
    const loaded = loadSidebarState()
    let selectedPageId = loaded.selectedId
    
    // Auto-select first page if none selected
    if (!selectedPageId) {
      const firstPage = findFirstLeafPage(loaded.pages)
      if (firstPage) {
        selectedPageId = firstPage.id
      }
    }
    
    setState({
      pages: loaded.pages,
      expandedIds: loaded.expandedIds,
      selectedPageId,
      renamingId: null,
      isHydrated: true,
    })
  }, [])

  // Persist to storage whenever state changes (but only after hydration)
  useEffect(() => {
    if (!state.isHydrated) return

    saveSidebarState({
      pages: state.pages,
      expandedIds: state.expandedIds,
      selectedId: state.selectedPageId,
    })
  }, [state.pages, state.expandedIds, state.selectedPageId, state.isHydrated])

  // Auto-select first page if selection becomes invalid
  useEffect(() => {
    if (!state.isHydrated || state.selectedPageId) return
    
    const firstPage = findFirstLeafPage(state.pages)
    if (firstPage) {
      setState((prev) => ({ ...prev, selectedPageId: firstPage.id }))
    }
  }, [state.pages, state.isHydrated, state.selectedPageId])

  // Find the currently selected page
  const selectedPage = state.selectedPageId
    ? findPageById(state.pages, state.selectedPageId)?.page || null
    : null

  // Memoized handlers
  const handleSelectPage = useCallback((pageId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPageId: pageId,
    }))
  }, [])

  const handleToggleExpand = useCallback((pageId: string) => {
    setState((prev) => {
      const newExpanded = prev.expandedIds.includes(pageId)
        ? prev.expandedIds.filter(id => id !== pageId)
        : [...prev.expandedIds, pageId]
      return {
        ...prev,
        expandedIds: newExpanded,
      }
    })
  }, [])

  const handleCreatePage = useCallback((parentId?: string) => {
    setState((prev) => {
      let newPageId: string | null = null
      
      if (parentId) {
        // Add page as child of parentId
      const updatedPages = prev.pages.map((section) => {
        if (section.children) {
          const result = addChild(section.children, parentId)
          if (result.newPageId) {
            newPageId = result.newPageId
            return {
              ...section,
              children: result.pages,
            }
          }
        }
        return section
      })

      if (!newPageId) return prev

        const newExpanded = prev.expandedIds.includes(parentId)
          ? prev.expandedIds
          : [...prev.expandedIds, parentId]

      return {
        ...prev,
        pages: updatedPages,
        expandedIds: newExpanded,
          selectedPageId: newPageId,
          renamingId: null,
          shouldFocusTitle: true,
      }
      } else {
        // Add page to root (Private section)
      const privateSection = prev.pages.find((s) => s.id === "private") || prev.pages[0]
      if (!privateSection) return prev

      const result = addChild([privateSection], privateSection.id)
      const newPageId = result.newPageId

      const updatedPages = prev.pages.map((section) => {
        if (section.id === privateSection.id) {
          return result.pages[0]
        }
        return section
      })

        const newExpanded = prev.expandedIds.includes(privateSection.id)
          ? prev.expandedIds
          : [...prev.expandedIds, privateSection.id]

      return {
        ...prev,
        pages: updatedPages,
        expandedIds: newExpanded,
          selectedPageId: newPageId,
          renamingId: null,
          shouldFocusTitle: true,
        }
      }
    })
  }, [])

  const handleRename = useCallback((pageId: string) => {
    setState((prev) => ({
      ...prev,
      renamingId: pageId,
    }))
  }, [])

  const handleRenameSave = useCallback((pageId: string, newTitle: string) => {
    setState((prev) => {
      const updatedPages = prev.pages.map((section) => ({
        ...section,
        children: section.children
          ? renameNode(section.children, pageId, newTitle)
          : undefined,
      }))
      return {
        ...prev,
        pages: updatedPages,
        renamingId: null,
      }
    })
  }, [])

  const handleRenameCancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      renamingId: null,
    }))
  }, [])

  const handleDuplicate = useCallback((pageId: string) => {
    setState((prev) => {
      let newPageId: string | null = null
      const updatedPages = prev.pages.map((section) => {
        if (section.children) {
          const result = duplicateNode(section.children, pageId)
          if (result && result.newPageId) {
            newPageId = result.newPageId
            return {
              ...section,
              children: result.pages,
            }
          }
        }
        return section
      })

      if (!newPageId) return prev

      return {
        ...prev,
        pages: updatedPages,
        selectedPageId: newPageId,
      }
    })
  }, [])

  const handleDelete = useCallback((pageId: string) => {
    setState((prev) => {
      const fallbackId = findFallbackSelection(prev.pages, pageId)

      const updatedPages = prev.pages.map((section) => ({
        ...section,
        children: section.children
          ? deleteNode(section.children, pageId)
          : undefined,
      }))

      const newExpanded = prev.expandedIds.filter(id => id !== pageId)

      const newRenamingId =
        prev.renamingId === pageId ? null : prev.renamingId

      return {
        ...prev,
        pages: updatedPages,
        expandedIds: newExpanded,
        selectedPageId: fallbackId,
        renamingId: newRenamingId,
      }
    })
  }, [])

  // Handle document changes (blocks)
  const handleUpdatePageDoc = useCallback(
    (pageId: string, doc: Doc) => {
      setState((prev) => {
        const updatedPages = updatePageDocument(prev.pages, pageId, doc)
        return {
          ...prev,
          pages: updatedPages,
        }
      })
    },
    []
  )

  // Handle page title change (syncs document.title to page.title)
  const handleUpdatePageTitle = useCallback((pageId: string, newTitle: string) => {
    setState((prev) => {
      const updatedPages = renameNode(prev.pages, pageId, newTitle)
      return {
        ...prev,
        pages: updatedPages,
      }
    })
  }, [])

  // Reset shouldFocusTitle after it's been used
  const handleTitleFocusComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      shouldFocusTitle: false,
    }))
  }, [])

  // Handle drag and drop - move page to new location
  // targetSectionId: which section the target is in
  // targetParentId: null for root level, or page ID if nesting inside a page
  // targetIndex: position within the target parent's children
  const handleMovePage = useCallback(
    (pageId: string, targetSectionId: string, targetParentId: string | null, targetIndex: number) => {
      setState((prev) => {
        // Find the page being moved
        let pageToMove: PageNode | null = null
        let sourceSectionId: string | null = null

        for (const section of prev.pages) {
          const found = findPageById(section.children || [], pageId)
          if (found) {
            pageToMove = found.page
            sourceSectionId = section.id
            break
          }
        }

        if (!pageToMove || !sourceSectionId) {
          return prev // Page not found
        }

        // Prevent moving into itself or descendants
        if (targetParentId === pageId) {
          return prev
        }

        // Check if targetParentId is a descendant
        if (targetParentId) {
          const targetInfo = findPageById(prev.pages.flatMap((s) => s.children || []), targetParentId)
          if (targetInfo) {
            const pageInfo = findPageById(prev.pages.flatMap((s) => s.children || []), pageId)
            if (pageInfo && pageInfo.page.children) {
              function isDescendant(parent: PageNode, childId: string): boolean {
                if (!parent.children) return false
                for (const child of parent.children) {
                  if (child.id === childId) return true
                  if (child.children && isDescendant(child, childId)) return true
                }
                return false
              }
              if (isDescendant(pageInfo.page, targetParentId)) {
                return prev // Can't move into own descendant
              }
            }
          }
        }

        // Remove page from source section
        const updatedPages = prev.pages.map((section) => {
          if (section.id === sourceSectionId) {
            return {
              ...section,
              children: deleteNode(section.children || [], pageId),
            }
          }
          return section
        })

        // Add page to target section
        const finalPages = updatedPages.map((section) => {
          if (section.id === targetSectionId) {
            const children = section.children || []
            
            if (targetParentId === null) {
              // Moving to root level of section
              const updated = [...children]
              updated.splice(targetIndex, 0, { ...pageToMove!, parentId: undefined })
              return { ...section, children: updated }
            } else {
              // Moving inside a page (nesting)
              return {
                ...section,
                children: movePage(children, pageId, targetParentId, targetIndex),
              }
            }
          }
          return section
        })

        // Auto-expand target parent if nesting
        let newExpandedIds = prev.expandedIds
        if (targetParentId && !newExpandedIds.includes(targetParentId)) {
          newExpandedIds = [...newExpandedIds, targetParentId]
        }

        return {
          ...prev,
          pages: finalPages,
          expandedIds: newExpandedIds,
        }
      })
    },
    []
  )

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      <Sidebar
        pages={state.pages}
        selectedPageId={state.selectedPageId}
        expandedIds={state.expandedIds}
        renamingId={state.renamingId}
        onSelectPage={handleSelectPage}
        onToggleExpand={handleToggleExpand}
        onCreatePage={handleCreatePage}
        onRename={handleRename}
        onRenameSave={handleRenameSave}
        onRenameCancel={handleRenameCancel}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onMovePage={handleMovePage}
      />
      <MainContent
        selectedPage={selectedPage}
        onUpdatePageDoc={handleUpdatePageDoc}
        onUpdatePageTitle={handleUpdatePageTitle}
        shouldFocusTitle={state.shouldFocusTitle}
        onTitleFocusComplete={handleTitleFocusComplete}
      />
    </div>
  )
}
