import { PageNode, SidebarState, StoredState, Doc, Block } from "./types"
import { getInitialSidebarData, getDefaultExpandedIds } from "./mock-data"
import { createDefaultDocument } from "./doc-defaults"

const STORAGE_KEY = "notion-sidebar-state"
const STORAGE_VERSION = "4.0.0" // Updated to add Quick Note page content with callout, bookmark, page blocks

/**
 * Runtime type guards for data validation
 */
function isValidBlock(obj: any): obj is Block {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    (obj.type === "paragraph" || obj.type === "heading1" || obj.type === "heading2" || obj.type === "heading3" || obj.type === "todo" || obj.type === "divider" || obj.type === "bulleted" || obj.type === "numbered" || obj.type === "callout" || obj.type === "bookmark" || obj.type === "page") &&
    typeof obj.text === "string" &&
    (obj.checked === undefined || typeof obj.checked === "boolean")
  )
}

function isValidDocument(obj: any): obj is Doc {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.title === "string" &&
    Array.isArray(obj.blocks) &&
    obj.blocks.every(isValidBlock)
  )
}

function isValidPageNode(obj: any): obj is PageNode {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    (obj.icon === undefined || typeof obj.icon === "string") &&
    (obj.children === undefined || Array.isArray(obj.children)) &&
    (obj.parentId === undefined || typeof obj.parentId === "string") &&
    isValidDocument(obj.doc) // doc is now required
  )
}

function isValidPageNodeArray(arr: any): arr is PageNode[] {
  return Array.isArray(arr) && arr.every(isValidPageNode)
}

function isValidSidebarState(obj: any): obj is SidebarState {
  return (
    typeof obj === "object" &&
    obj !== null &&
    isValidPageNodeArray(obj.pages) &&
    Array.isArray(obj.expandedIds) &&
    obj.expandedIds.every((id: any) => typeof id === "string") &&
    (obj.selectedId === null || typeof obj.selectedId === "string")
  )
}

function isValidStoredState(obj: any): obj is StoredState {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.version === "string" &&
    isValidSidebarState(obj.data)
  )
}

/**
 * Recursively validate and sanitize page tree
 */
function sanitizePageNode(node: any): PageNode | null {
  if (!isValidPageNode(node)) {
    return null
  }

  const sanitized: PageNode = {
    id: String(node.id),
    title: String(node.title),
  }

  if (node.icon !== undefined) {
    sanitized.icon = String(node.icon)
  }

  if (node.parentId !== undefined) {
    sanitized.parentId = String(node.parentId)
  }

  // Ensure doc exists (required field)
  if (isValidDocument(node.doc)) {
    sanitized.doc = {
      title: String(node.doc.title),
      blocks: node.doc.blocks.map((block: any) => {
        // Map valid block types, default to paragraph for unknown types
        let blockType = "paragraph"
        if (block.type === "heading1" || block.type === "heading2" || block.type === "heading3" || 
            block.type === "todo" || block.type === "divider" || block.type === "bulleted" || block.type === "numbered" ||
            block.type === "callout" || block.type === "bookmark" || block.type === "page") {
          blockType = block.type
        }
        
        const sanitizedBlock: any = {
          id: String(block.id),
          type: blockType,
          text: String(block.text),
        }
        // Preserve checked for todo blocks
        if (block.type === "todo" && block.checked !== undefined) {
          sanitizedBlock.checked = Boolean(block.checked)
        }
        // Preserve callout icon
        if (block.type === "callout" && block.icon !== undefined) {
          sanitizedBlock.icon = String(block.icon)
        }
        // Preserve bookmark properties
        if (block.type === "bookmark") {
          if (block.url !== undefined) sanitizedBlock.url = String(block.url)
          if (block.title !== undefined) sanitizedBlock.title = String(block.title)
          if (block.description !== undefined) sanitizedBlock.description = String(block.description)
          if (block.imageUrl !== undefined) sanitizedBlock.imageUrl = String(block.imageUrl)
        }
        // Preserve marks if present
        if (block.marks && Array.isArray(block.marks.ranges)) {
          sanitizedBlock.marks = {
            ranges: block.marks.ranges
              .filter((range: any) => 
                typeof range.start === "number" &&
                typeof range.end === "number" &&
                (range.type === "bold" || range.type === "italic" || range.type === "underline")
              )
              .map((range: any) => ({
                start: Math.max(0, range.start),
                end: Math.max(0, range.end),
                type: range.type,
              })),
          }
        }
        return sanitizedBlock
      }),
    }
  } else {
    // If doc is missing or invalid, attach default
    sanitized.doc = createDefaultDocument()
  }

  if (Array.isArray(node.children)) {
    const sanitizedChildren = node.children
      .map(sanitizePageNode)
      .filter((child): child is PageNode => child !== null)
    if (sanitizedChildren.length > 0) {
      sanitized.children = sanitizedChildren
    }
  }

  return sanitized
}

/**
 * Recursively attach default documents to pages that don't have them
 * Every page must have a doc (required field)
 */
function attachDefaultDocuments(pages: PageNode[]): PageNode[] {
  return pages.map((page) => {
    const updated: PageNode = { ...page }
    
    // Attach default document if page doesn't have one
    // All pages must have a doc (required field)
    if (!updated.doc) {
      updated.doc = createDefaultDocument()
    }
    
    // Recursively process children
    if (updated.children) {
      updated.children = attachDefaultDocuments(updated.children)
    }
    
    return updated
  })
}

/**
 * Load sidebar state from localStorage with corruption guards
 */
export function loadSidebarState(): SidebarState {
  if (typeof window === "undefined") {
    return getDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return getDefaultState()
    }

    const parsed = JSON.parse(raw)

    // Check if it's the new versioned format
    if (isValidStoredState(parsed)) {
      const state = parsed.data
      
      // Migration: If version is old, reset to fresh defaults to get new sidebar items
      if (parsed.version !== STORAGE_VERSION) {
        console.log(`Migrating from version ${parsed.version} to ${STORAGE_VERSION}: resetting to fresh defaults`)
        return getDefaultState()
      }
      
      // Migration: If documents are missing, attach defaults
      if (needsDocumentMigration(state.pages)) {
        console.log("Migrating documents: attaching default documents to pages")
        return {
          ...state,
          pages: attachDefaultDocuments(state.pages),
        }
      }
      
      return state
    }

    // Try to parse as legacy format (direct SidebarState)
    if (isValidSidebarState(parsed)) {
      // Legacy format - migrate by attaching documents
      console.log("Migrating from legacy format: attaching default documents to pages")
      return {
        ...parsed,
        pages: attachDefaultDocuments(parsed.pages),
      }
    }

      // Attempt to sanitize corrupted data
      if (parsed && typeof parsed === "object") {
        const sanitized: SidebarState = {
          pages: Array.isArray(parsed.pages)
            ? parsed.pages
                .map(sanitizePageNode)
                .filter((p): p is PageNode => p !== null)
            : getInitialSidebarData(),
          expandedIds: Array.isArray(parsed.expandedIds)
            ? parsed.expandedIds.filter((id: any) => typeof id === "string")
            : getDefaultExpandedIds(),
          selectedId:
            parsed.selectedId === null || typeof parsed.selectedId === "string"
              ? parsed.selectedId
              : null,
        }

        // If we got at least some valid data, return it (with migration)
        if (sanitized.pages.length > 0) {
          console.warn("Recovered corrupted sidebar state, some data may be lost")
          return {
            ...sanitized,
            pages: attachDefaultDocuments(sanitized.pages),
          }
        }
      }

    // If all else fails, return defaults
    console.warn("Failed to load sidebar state, using defaults")
    return getDefaultState()
  } catch (error) {
    console.error("Error loading sidebar state:", error)
    return getDefaultState()
  }
}

/**
 * Save sidebar state to localStorage with versioning
 */
export function saveSidebarState(state: SidebarState): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const stored: StoredState = {
      version: STORAGE_VERSION,
      data: state,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded, cannot save sidebar state")
    } else {
      console.error("Error saving sidebar state:", error)
    }
  }
}

/**
 * Check if pages need document migration (any page without a doc)
 */
function needsDocumentMigration(pages: PageNode[]): boolean {
  for (const page of pages) {
    // If page has no doc, it needs migration (doc is required)
    if (!page.doc) {
      return true
    }
    // Recursively check children
    if (page.children && needsDocumentMigration(page.children)) {
      return true
    }
  }
  return false
}

/**
 * Get default sidebar state
 */
function getDefaultState(): SidebarState {
  return {
    pages: attachDefaultDocuments(getInitialSidebarData()),
    expandedIds: getDefaultExpandedIds(),
    selectedId: null,
  }
}

/**
 * Clear stored sidebar state (useful for reset/debugging)
 */
export function clearSidebarState(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing sidebar state:", error)
  }
}
