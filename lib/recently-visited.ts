/**
 * Recently visited pages tracking
 */

const STORAGE_KEY = "recentlyVisited"
const MAX_ITEMS = 6

export interface RecentPage {
  id: string
  title: string
  icon?: string
  href: string
  lastVisited: number
  coverColor?: string
  coverImage?: string
}

// Predefined cover colors matching Notion's palette
const COVER_COLORS = [
  "rgba(227, 226, 224, 0.5)", // Light gray
  "rgba(238, 224, 218, 0.5)", // Light brown
  "rgba(250, 222, 201, 0.5)", // Light orange
  "rgba(253, 236, 200, 0.5)", // Light yellow
  "rgba(219, 237, 219, 0.5)", // Light green
  "rgba(211, 229, 239, 0.5)", // Light blue
  "rgba(232, 222, 238, 0.5)", // Light purple
  "rgba(245, 224, 233, 0.5)", // Light pink
  "rgba(255, 226, 221, 0.5)", // Light red
]

/**
 * Get a consistent cover color for a page based on its ID
 */
export function getCoverColorForPage(pageId: string): string {
  // Use a simple hash to get a consistent color for each page
  let hash = 0
  for (let i = 0; i < pageId.length; i++) {
    hash = ((hash << 5) - hash) + pageId.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  const index = Math.abs(hash) % COVER_COLORS.length
  return COVER_COLORS[index]
}

/**
 * Load recently visited pages from localStorage
 */
export function getRecentPages(): RecentPage[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    // Validate and filter valid entries
    return parsed
      .filter(
        (item): item is RecentPage =>
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.href === "string" &&
          typeof item.lastVisited === "number"
      )
      .sort((a, b) => b.lastVisited - a.lastVisited)
      .slice(0, MAX_ITEMS)
  } catch (error) {
    console.error("Error loading recently visited pages:", error)
    return []
  }
}

/**
 * Add or update a page in the recently visited list
 */
export function addRecentPage(page: RecentPage): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = getRecentPages()

    // Remove existing entry if present
    const filtered = current.filter((p) => p.id !== page.id)

    // Add new entry at the beginning
    const updated = [page, ...filtered].slice(0, MAX_ITEMS)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving recently visited page:", error)
  }
}

/**
 * Format a timestamp as a relative time string
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (seconds < 60) {
    return "Just now"
  } else if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`
  } else if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  } else if (days === 1) {
    return "Yesterday"
  } else if (days < 7) {
    return `${days} days ago`
  } else if (weeks === 1) {
    return "1 week ago"
  } else if (weeks < 4) {
    return `${weeks} weeks ago`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

/**
 * Clear all recently visited pages (useful for debugging)
 */
export function clearRecentPages(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing recently visited pages:", error)
  }
}
