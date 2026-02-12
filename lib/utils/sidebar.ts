import { PageNode } from "@/lib/types"

export function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

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

export function addPageToTree(
  pages: PageNode[],
  newPage: PageNode,
  parentId?: string
): PageNode[] {
  if (!parentId) {
    // Add to root
    return [...pages, newPage]
  }

  return pages.map((page) => {
    if (page.id === parentId) {
      return {
        ...page,
        children: [...(page.children || []), newPage],
      }
    }
    if (page.children) {
      return {
        ...page,
        children: addPageToTree(page.children, newPage, parentId),
      }
    }
    return page
  })
}

export function removePageFromTree(pages: PageNode[], id: string): PageNode[] {
  return pages
    .filter((page) => page.id !== id)
    .map((page) => {
      if (page.children) {
        return {
          ...page,
          children: removePageFromTree(page.children, id),
        }
      }
      return page
    })
}

export function duplicatePage(page: PageNode): PageNode {
  const newId = generatePageId()
  return {
    ...page,
    id: newId,
    title: `${page.title} (Copy)`,
    children: page.children
      ? page.children.map((child) => duplicatePage(child))
      : undefined,
  }
}

export function updatePageInTree(
  pages: PageNode[],
  id: string,
  updates: Partial<PageNode>
): PageNode[] {
  return pages.map((page) => {
    if (page.id === id) {
      return { ...page, ...updates }
    }
    if (page.children) {
      return {
        ...page,
        children: updatePageInTree(page.children, id, updates),
      }
    }
    return page
  })
}

