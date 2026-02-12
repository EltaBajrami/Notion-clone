export interface Page {
  id: string
  title: string
  icon?: string
  isFavorite?: boolean
  parentId?: string // For nested structure
  children?: Page[]
  createdAt: number
}

export interface SidebarSection {
  id: string
  title: string
  pages: Page[]
  isCollapsed?: boolean
}

export interface SidebarState {
  pages: Page[]
  sections: SidebarSection[]
  expandedPages: string[] // Array of page IDs (Set can't be serialized)
  selectedPageId: string | null
}
