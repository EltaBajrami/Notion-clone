"use client"

import { useEffect, useRef, useState, forwardRef, useCallback } from "react"
import { BlockType } from "@/lib/types"
import { Type, Heading1, Heading2, Heading3, List, ListOrdered } from "lucide-react"
import { getCaretRectFromSelection } from "./RichTextBlock"

export interface SlashMenuCommand {
  type: BlockType
  label: string
  keywords: string[]
  icon: React.ReactNode
  shortcut?: string
}

// Icon components - 16px size, neutral-500 color
const TextIcon = () => (
  <Type className="w-4 h-4 text-gray-500" strokeWidth={2} />
)

const Heading1Icon = () => (
  <Heading1 className="w-4 h-4 text-gray-500" strokeWidth={2} />
)

const Heading2Icon = () => (
  <Heading2 className="w-4 h-4 text-gray-500" strokeWidth={2} />
)

const Heading3Icon = () => (
  <Heading3 className="w-4 h-4 text-gray-500" strokeWidth={2} />
)

const BulletedListIcon = () => (
  <List className="w-4 h-4 text-gray-500" strokeWidth={2} />
)

const NumberedListIcon = () => (
  <ListOrdered className="w-4 h-4 text-gray-500" strokeWidth={2} />
)

// Default BASIC_BLOCKS config for the slash menu
export const SLASH_COMMANDS: SlashMenuCommand[] = [
  {
    type: "paragraph",
    label: "Text",
    keywords: ["text", "paragraph", "p"],
    icon: <TextIcon />,
    shortcut: undefined,
  },
  {
    type: "heading1",
    label: "Heading 1",
    keywords: ["heading", "h1", "title", "heading1"],
    icon: <Heading1Icon />,
    shortcut: "#",
  },
  {
    type: "heading2",
    label: "Heading 2",
    keywords: ["heading2", "h2", "subheading"],
    icon: <Heading2Icon />,
    shortcut: "##",
  },
  {
    type: "heading3",
    label: "Heading 3",
    keywords: ["heading3", "h3", "subheading"],
    icon: <Heading3Icon />,
    shortcut: "###",
  },
  {
    type: "bulleted",
    label: "Bulleted list",
    keywords: ["bullet", "bulleted", "list", "ul", "unordered", "bullet list"],
    icon: <BulletedListIcon />,
    shortcut: "-",
  },
  {
    type: "numbered",
    label: "Numbered list",
    keywords: ["numbered", "ordered", "ol", "list", "number", "numbered list", "ordered list"],
    icon: <NumberedListIcon />,
    shortcut: "1.",
  },
]

interface SlashMenuProps {
  anchorRect: DOMRect | null
  blockId: string
  items: SlashMenuCommand[]
  query: string
  activeIndex: number
  onSelect: (command: BlockType) => void
  onClose: () => void
  open: boolean
  menuRef?: React.RefObject<HTMLDivElement>
}

/**
 * Compute anchor rect from the actual selection range.
 * Falls back to block's editable element if selection range is unavailable or empty.
 */
function computeAnchorRect(blockId: string): DOMRect | null {
  // Try to get selection range from window.getSelection() (works for contenteditable)
  const sel = window.getSelection()
  const range = sel?.rangeCount ? sel.getRangeAt(0) : null
  
  if (range) {
    const rect = range.getBoundingClientRect()
    // If range has valid dimensions, use it
    if (rect.width > 0 || rect.height > 0) {
      return rect
    }
  }
  
  // For textareas, we need to find the textarea and use getCaretRectFromSelection
  // Try to find the focused textarea first (most likely to be the one with the menu)
  const activeTextarea = document.activeElement as HTMLTextAreaElement | null
  if (activeTextarea && activeTextarea.tagName === 'TEXTAREA') {
    const caretRect = getCaretRectFromSelection(activeTextarea)
    if (caretRect && (caretRect.width > 0 || caretRect.height > 0)) {
      return caretRect
    }
  }
  
  // Fallback: find the block's textarea by searching all textareas
  // Look for textarea with data-block-id attribute or find by blockId
  const blockElement = document.querySelector(`[data-block-id="${blockId}"]`)
  if (blockElement) {
    const textarea = blockElement.querySelector('textarea') as HTMLTextAreaElement | null
    if (textarea) {
      const caretRect = getCaretRectFromSelection(textarea)
      if (caretRect && (caretRect.width > 0 || caretRect.height > 0)) {
        return caretRect
      }
      // If caret rect is empty, use textarea's bounding rect at start
      const textareaRect = textarea.getBoundingClientRect()
      return new DOMRect(textareaRect.left, textareaRect.top, 1, textareaRect.height || 20)
    }
  }
  
  // Last resort: try to find any focused textarea
  const allTextareas = document.querySelectorAll('textarea')
  for (const textarea of allTextareas) {
    if (textarea === document.activeElement) {
      const caretRect = getCaretRectFromSelection(textarea)
      if (caretRect && (caretRect.width > 0 || caretRect.height > 0)) {
        return caretRect
      }
      const textareaRect = textarea.getBoundingClientRect()
      return new DOMRect(textareaRect.left, textareaRect.top, 1, textareaRect.height || 20)
    }
  }
  
  return null
}

export const SlashMenu = forwardRef<HTMLDivElement, SlashMenuProps>(function SlashMenu({
  anchorRect: initialAnchorRect,
  blockId,
  items,
  query,
  activeIndex,
  onSelect,
  onClose,
  open,
}, ref) {
  const listRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [computedAnchorRect, setComputedAnchorRect] = useState<DOMRect | null>(initialAnchorRect)

  // Update computed anchor rect when initialAnchorRect prop changes
  useEffect(() => {
    if (initialAnchorRect) {
      setComputedAnchorRect(initialAnchorRect)
    }
  }, [initialAnchorRect])

  // Compute anchor rect from selection range (only if not explicitly provided)
  const updateAnchorRect = useCallback(() => {
    // If we have an explicit anchorRect, use it instead of recomputing
    if (initialAnchorRect) {
      setComputedAnchorRect(initialAnchorRect)
      return
    }
    const rect = computeAnchorRect(blockId)
    if (rect) {
      setComputedAnchorRect(rect)
    }
  }, [blockId, initialAnchorRect])

  // Recompute anchor rect when menu opens or query changes (only if not explicitly provided)
  useEffect(() => {
    if (open && !initialAnchorRect) {
      updateAnchorRect()
    }
  }, [open, query, updateAnchorRect, initialAnchorRect])

  // Filter items based on query (case-insensitive substring match)
  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true
    const searchLower = query.toLowerCase()
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
    )
  })

  // Organize items into sections
  // When no query: Show "Suggested" section with Bulleted list, Heading 1, Numbered list, Text
  // When query exists: Show all filtered items in "Basic blocks" section
  const hasQuery = query.trim().length > 0
  
  // Suggested items in specific order (only shown when no query)
  const suggestedOrder: BlockType[] = ["bulleted", "heading1", "numbered", "paragraph"]
  const suggestedItems = !hasQuery 
    ? suggestedOrder
        .map(type => filteredItems.find(item => item.type === type))
        .filter((item): item is SlashMenuCommand => item !== undefined)
    : []
  
  // Basic blocks items
  // When no query: Show remaining items (Heading 2, Heading 3)
  // When query: Show all filtered items
  const basicBlocksItems = hasQuery 
    ? filteredItems 
    : filteredItems.filter((item) => 
        item.type !== "bulleted" && 
        item.type !== "heading1" && 
        item.type !== "numbered" && 
        item.type !== "paragraph"
      )
  
  // Find which item in displayOrder corresponds to activeIndex in filteredItems
  const activeItem = filteredItems[activeIndex]
  const isItemActive = (item: SlashMenuCommand) => activeItem && item.type === activeItem.type

  // Calculate position from anchorRect and handle viewport collisions
  const calculatePosition = useCallback(() => {
    if (!computedAnchorRect) return

    // Get actual menu dimensions
    const menuWidth = 340 // Menu width
    const menuHeight = menuContainerRef.current?.offsetHeight || 400 // Use actual height or fallback
    
    // Position menu ~6-8px below the caret (default)
    let top = computedAnchorRect.bottom + 8
    let left = computedAnchorRect.left // Left-aligned with text column
    
    // Viewport collision handling
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Clamp horizontally within viewport
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8 // 8px padding from right edge
    }
    if (left < 8) {
      left = 8 // 8px padding from left edge
    }
    
    // Check if menu would overflow bottom - flip above if needed
    if (top + menuHeight > viewportHeight - 8) {
      // Try positioning above the caret
      const aboveTop = computedAnchorRect.top - menuHeight - 8
      if (aboveTop >= 8) {
        top = aboveTop
      } else {
        // If still off screen, clamp to viewport bottom
        top = Math.max(8, viewportHeight - menuHeight - 8)
      }
    }
    
    // Final top clamp (shouldn't be needed after above logic, but safety check)
    if (top < 8) {
      top = 8
    }
    
    setPosition({ top, left })
  }, [computedAnchorRect])

  // Calculate position when anchor rect or menu size changes
  useEffect(() => {
    if (!open || !computedAnchorRect) return
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      calculatePosition()
    })
  }, [computedAnchorRect, open, filteredItems.length, calculatePosition])

  // Update position on window scroll and resize
  useEffect(() => {
    if (!open || !computedAnchorRect) return

    const handleScroll = () => {
      // Recompute anchor rect from current selection
      updateAnchorRect()
      // Position will be recalculated by the effect above
    }

    const handleResize = () => {
      // Recompute anchor rect and position
      updateAnchorRect()
    }

    // Listen to scroll on window (capture phase) and any scrollable containers
    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleResize)
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleResize)
    }
  }, [open, computedAnchorRect, updateAnchorRect])

  // Scroll active item into view when activeIndex changes
  useEffect(() => {
    if (activeItemRef.current && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect()
      const itemRect = activeItemRef.current.getBoundingClientRect()
      
      // Check if item is outside visible area
      if (itemRect.top < listRect.top) {
        // Item is above visible area, scroll up
        activeItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
      } else if (itemRect.bottom > listRect.bottom) {
        // Item is below visible area, scroll down
        activeItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [activeIndex, filteredItems.length])

  // Don't render if not open or no anchor rect
  if (!open || !computedAnchorRect) {
    return null
  }

  return (
    <div
      ref={(node) => {
        menuContainerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      }}
      data-slash-menu="true"
      className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden p-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: "340px",
        maxHeight: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Command list */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
        {filteredItems.length === 0 ? (
          <div className="px-2.5 py-3 text-sm text-gray-500 text-center">No matches</div>
        ) : (
          <>
            {/* Suggested section - only show when no query */}
            {suggestedItems.length > 0 && (
              <>
                <div className="px-2.5 mt-1.5 mb-1.5">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Suggested
                  </div>
                </div>
                {suggestedItems.map((item, index) => {
                  // Check if this item matches the active item from filteredItems
                  const isActive = isItemActive(item)

                  return (
                    <button
                      key={`suggested-${item.label}-${index}`}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => onSelect(item.type)}
                      className={`w-full flex items-center gap-3 px-2.5 h-9 transition-colors cursor-pointer outline-none ${
                        isActive
                          ? "bg-gray-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-500">
                        {item.icon}
                      </div>
                      
                      {/* Label */}
                      <span className="flex-1 text-left text-sm font-medium text-gray-800">{item.label}</span>
                      
                      {/* Shortcut hint - right-aligned */}
                      {item.shortcut && (
                        <span className="flex-shrink-0 text-xs text-gray-400 font-mono">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  )
                })}
              </>
            )}

            {/* Basic blocks section */}
            {basicBlocksItems.length > 0 && (
              <>
                <div className="px-2.5 mt-1.5 mb-1.5">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Basic blocks
                  </div>
                </div>
                {basicBlocksItems.map((item, index) => {
                  // Check if this item matches the active item from filteredItems
                  const isActive = isItemActive(item)

                  return (
                    <button
                      key={`basic-${item.label}-${index}`}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => onSelect(item.type)}
                      className={`w-full flex items-center gap-3 px-2.5 h-9 transition-colors cursor-pointer outline-none ${
                        isActive
                          ? "bg-gray-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-500">
                        {item.icon}
                      </div>
                      
                      {/* Label */}
                      <span className="flex-1 text-left text-sm font-medium text-gray-800">{item.label}</span>
                      
                      {/* Shortcut hint - right-aligned */}
                      {item.shortcut && (
                        <span className="flex-shrink-0 text-xs text-gray-400 font-mono">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom sticky row - Close menu */}
      <div className="border-t border-gray-200 mt-2">
        <button
          onClick={onClose}
          className="w-full flex items-center justify-between px-2.5 h-9 text-sm text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
        >
          <span className="text-left">Close menu</span>
          <span className="text-xs text-gray-400 font-mono">esc</span>
        </button>
      </div>
    </div>
  )
})
