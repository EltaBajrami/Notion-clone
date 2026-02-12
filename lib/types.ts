/**
 * Document content block types
 */
export type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "todo" | "divider" | "bulleted" | "numbered" | "callout" | "bookmark" | "page"

/**
 * Mark range for text formatting
 */
export interface MarkRange {
  start: number
  end: number
  type: "bold" | "italic" | "underline"
}

/**
 * Block marks for rich text formatting
 */
export interface BlockMarks {
  ranges: MarkRange[]
}

/**
 * Document content block
 */
export interface Block {
  id: string
  type: BlockType
  text: string
  marks?: BlockMarks
  checked?: boolean // For todo blocks
  icon?: string // For callout blocks
  url?: string // For bookmark blocks
  title?: string // For bookmark blocks (link title)
  description?: string // For bookmark blocks
  imageUrl?: string // For bookmark blocks (preview image)
}

/**
 * Document content
 */
export interface Doc {
  title: string
  blocks: Block[]
}

// Alias for backward compatibility
export type Document = Doc

/**
 * Core data model for sidebar pages
 */
export interface Page {
  id: string
  title: string
  icon?: string
  doc: Doc // Required: every page must have a document
  children?: Page[]
  parentId?: string
}

// Alias for backward compatibility
export type PageNode = Page

/**
 * Sidebar state structure for persistence
 */
export interface SidebarState {
  pages: PageNode[]
  expandedIds: string[] // Array of page IDs (Set can't be serialized)
  selectedId: string | null
}

/**
 * Storage version for migration/validation
 */
export interface StoredState {
  version: string
  data: SidebarState
}
