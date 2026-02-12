import { PageNode } from "./types"
import { createDefaultDocument } from "./doc-defaults"

/**
 * Generate a unique page ID
 */
export function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Find a page by ID in the tree, returning the page, its parent, and path
 */
export function findPageById(
  pages: PageNode[],
  id: string
): { page: PageNode; parent: PageNode | null; path: PageNode[] } | null {
  for (const page of pages) {
    if (page.id === id) {
      return { page, parent: null, path: [page] }
    }
    if (page.children) {
      const found = findPageById(page.children, id)
      if (found) {
        return { ...found, path: [page, ...found.path] }
      }
    }
  }
  return null
}

/**
 * Find the first available leaf page (page with no children) in the tree
 * Returns null if no leaf pages exist
 */
export function findFirstLeafPage(pages: PageNode[]): PageNode | null {
  for (const page of pages) {
    // If page has no children, it's a leaf (but skip section nodes that are containers)
    // A leaf page should have a document (doc property)
    if (!page.children && page.doc) {
      return page
    }
    // If page has children, recurse into them
    if (page.children) {
      const found = findFirstLeafPage(page.children)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * Update a page's document in the tree
 * Returns a new tree with the document updated
 */
export function updatePageDocument(
  pages: PageNode[],
  pageId: string,
  doc: PageNode["doc"]
): PageNode[] {
  return pages.map((page) => {
    if (page.id === pageId) {
      return { ...page, doc }
    }
    if (page.children) {
      return {
        ...page,
        children: updatePageDocument(page.children, pageId, doc),
      }
    }
    return page
  })
}

/**
 * Add a child page to a parent node
 * Returns a new tree with the child added
 */
export function addChild(
  pages: PageNode[],
  parentId: string
): { pages: PageNode[]; newPageId: string } {
  const newPage: PageNode = {
    id: generatePageId(),
    title: "Untitled",
    parentId: parentId,
    doc: createDefaultDocument(), // Attach default document
  }

  const updatedPages = pages.map((page) => {
    if (page.id === parentId) {
      return {
        ...page,
        children: [...(page.children || []), newPage],
      }
    }
    if (page.children) {
      const result = addChild(page.children, parentId)
      return {
        ...page,
        children: result.pages,
      }
    }
    return page
  })

  return { pages: updatedPages, newPageId: newPage.id }
}

/**
 * Rename a node in the tree
 * Returns a new tree with the node renamed
 */
export function renameNode(
  pages: PageNode[],
  id: string,
  title: string
): PageNode[] {
  return pages.map((page) => {
    if (page.id === id) {
      return { ...page, title }
    }
    if (page.children) {
      return {
        ...page,
        children: renameNode(page.children, id, title),
      }
    }
    return page
  })
}

/**
 * Duplicate a node and its entire subtree
 * Returns a new tree with the duplicated node added as a sibling
 */
export function duplicateNode(
  pages: PageNode[],
  id: string
): { pages: PageNode[]; newPageId: string } | null {
  // Deep clone the node and all its children recursively
  function deepClone(node: PageNode): PageNode {
    const newId = generatePageId()
    return {
      ...node,
      id: newId,
      title: `${node.title} (Copy)`,
      children: node.children
        ? node.children.map(deepClone)
        : undefined,
    }
  }

  // Helper to find and duplicate within a page array
  function duplicateInPages(
    pageList: PageNode[],
    targetId: string
  ): { pages: PageNode[]; newPageId: string | null } {
    for (let i = 0; i < pageList.length; i++) {
      const page = pageList[i]
      if (page.id === targetId) {
        // Found the node to duplicate
        const duplicated = deepClone(page)
        // Insert duplicate after original
        const newPages = [...pageList]
        newPages.splice(i + 1, 0, duplicated)
        return { pages: newPages, newPageId: duplicated.id }
      }
      if (page.children) {
        const result = duplicateInPages(page.children, targetId)
        if (result.newPageId) {
          // Found and duplicated in children
          return {
            pages: pageList.map((p) =>
              p.id === page.id
                ? { ...p, children: result.pages }
                : p
            ),
            newPageId: result.newPageId,
          }
        }
      }
    }
    return { pages: pageList, newPageId: null }
  }

  const result = duplicateInPages(pages, id)
  if (!result.newPageId) return null

  return { pages: result.pages, newPageId: result.newPageId }
}

/**
 * Delete a node and its entire subtree
 * Returns a new tree with the node removed
 */
export function deleteNode(pages: PageNode[], id: string): PageNode[] {
  return pages
    .filter((page) => page.id !== id)
    .map((page) => {
      if (page.children) {
        return {
          ...page,
          children: deleteNode(page.children, id),
        }
      }
      return page
    })
}

/**
 * Find a sensible fallback selection after deletion
 * Returns parent ID if available, otherwise next sibling, otherwise null
 */
export function findFallbackSelection(
  pages: PageNode[],
  deletedId: string
): string | null {
  const found = findPageById(pages, deletedId)
  if (!found || !found.parent) {
    // No parent, try to find next sibling at root level
    const rootIndex = pages.findIndex((p) => p.id === deletedId)
    if (rootIndex !== -1 && rootIndex < pages.length - 1) {
      return pages[rootIndex + 1].id
    }
    return null
  }

  // Try to find next sibling
  const parent = found.parent
  if (parent.children) {
    const siblingIndex = parent.children.findIndex((p) => p.id === deletedId)
    if (siblingIndex !== -1) {
      // Next sibling exists
      if (siblingIndex < parent.children.length - 1) {
        return parent.children[siblingIndex + 1].id
      }
      // Previous sibling exists
      if (siblingIndex > 0) {
        return parent.children[siblingIndex - 1].id
      }
    }
  }

  // Fallback to parent
  return parent.id
}

/**
 * Remove a page from its current location in the tree
 * Returns the removed page and updated tree
 */
function removePageFromTree(
  pages: PageNode[],
  pageId: string
): { removedPage: PageNode | null; updatedPages: PageNode[] } {
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].id === pageId) {
      const removed = pages[i]
      const updated = [...pages]
      updated.splice(i, 1)
      return { removedPage: removed, updatedPages: updated }
    }
    if (pages[i].children) {
      const result = removePageFromTree(pages[i].children!, pageId)
      if (result.removedPage) {
        return {
          removedPage: result.removedPage,
          updatedPages: pages.map((p) =>
            p.id === pages[i].id
              ? { ...p, children: result.updatedPages }
              : p
          ),
        }
      }
    }
  }
  return { removedPage: null, updatedPages: pages }
}

/**
 * Insert a page into a specific location in the tree
 * If targetParentId is provided, adds as child. Otherwise, inserts at targetIndex in pages array.
 */
function insertPageIntoTree(
  pages: PageNode[],
  page: PageNode,
  targetParentId: string | null,
  targetIndex: number
): PageNode[] {
  if (targetParentId === null) {
    // Insert at root level
    const updated = [...pages]
    updated.splice(targetIndex, 0, { ...page, parentId: undefined })
    return updated
  }

  // Find the target parent and insert as child
  return pages.map((p) => {
    if (p.id === targetParentId) {
      const children = p.children || []
      const updated = [...children]
      updated.splice(targetIndex, 0, { ...page, parentId: targetParentId })
      return { ...p, children: updated }
    }
    if (p.children) {
      return {
        ...p,
        children: insertPageIntoTree(p.children, page, targetParentId, targetIndex),
      }
    }
    return p
  })
}

/**
 * Move a page to a new location in the tree
 * Can reorder within the same parent or move to a different parent (nesting)
 */
export function movePage(
  pages: PageNode[],
  pageId: string,
  targetParentId: string | null,
  targetIndex: number
): PageNode[] {
  // First, remove the page from its current location
  const { removedPage, updatedPages } = removePageFromTree(pages, pageId)
  
  if (!removedPage) {
    return pages // Page not found, return original
  }

  // Prevent moving a page into itself or its own descendants
  if (targetParentId === pageId) {
    return pages // Can't move into itself
  }

  // Check if targetParentId is a descendant of pageId
  function isDescendant(pages: PageNode[], ancestorId: string, descendantId: string): boolean {
    const found = findPageById(pages, ancestorId)
    if (!found || !found.page.children) return false
    
    function checkChildren(children: PageNode[]): boolean {
      for (const child of children) {
        if (child.id === descendantId) return true
        if (child.children && checkChildren(child.children)) return true
      }
      return false
    }
    
    return checkChildren(found.page.children)
  }

  if (targetParentId && isDescendant(pages, pageId, targetParentId)) {
    return pages // Can't move into own descendant
  }

  // Adjust targetIndex if moving within the same parent (need to account for removal)
  let adjustedIndex = targetIndex
  const sourceInfo = findPageById(pages, pageId)
  if (sourceInfo && sourceInfo.parent) {
    const sourceParentId = sourceInfo.parent.id
    if (targetParentId === sourceParentId) {
      const sourceIndex = sourceInfo.parent.children!.findIndex((p) => p.id === pageId)
      if (sourceIndex < targetIndex) {
        adjustedIndex = targetIndex - 1
      }
    }
  } else if (targetParentId === null && sourceInfo && !sourceInfo.parent) {
    // Moving at root level
    const sourceIndex = pages.findIndex((p) => p.id === pageId)
    if (sourceIndex < targetIndex) {
      adjustedIndex = targetIndex - 1
    }
  }

  // Insert the page at the new location
  return insertPageIntoTree(updatedPages, removedPage, targetParentId, adjustedIndex)
}
