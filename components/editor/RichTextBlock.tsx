"use client"

import { useRef, useEffect, useState } from "react"
import { Block, MarkRange } from "@/lib/types"

interface RichTextBlockProps {
  block: Block
  blockIndex?: number
  allBlocks?: Block[]
  isEditing: boolean
  onStartEdit: (clickPosition: number) => void
  onTextChange: (text: string, prevText?: string, selectionStart?: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, textarea: HTMLTextAreaElement) => void
  onRegisterRef: (ref: HTMLTextAreaElement | null) => void
  onBlur: () => void
  onSelectionChange?: (textarea: HTMLTextAreaElement) => void
  onSlashCommand?: (blockId: string, anchorRect: DOMRect, query: string) => void
  onToggleTodo?: (blockId: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  isSlashMenuOpen?: boolean
  isPlusButtonBlock?: boolean
}

/**
 * Get caret position coordinates in a textarea
 */
function getCaretPosition(textarea: HTMLTextAreaElement, position: number): { top: number; left: number } {
  // Create a temporary div with same styling to measure text
  const div = document.createElement("div")
  const style = window.getComputedStyle(textarea)
  
  // Copy relevant styles
  div.style.position = "absolute"
  div.style.visibility = "hidden"
  div.style.whiteSpace = "pre-wrap"
  div.style.wordWrap = "break-word"
  div.style.font = style.font
  div.style.fontSize = style.fontSize
  div.style.fontFamily = style.fontFamily
  div.style.fontWeight = style.fontWeight
  div.style.lineHeight = style.lineHeight
  div.style.padding = style.padding
  div.style.border = style.border
  div.style.width = style.width
  div.style.letterSpacing = style.letterSpacing
  
  document.body.appendChild(div)
  
  // Get text up to cursor position
  const textBeforeCursor = textarea.value.substring(0, position)
  
  // Create a span to mark the cursor position
  div.textContent = textBeforeCursor
  const span = document.createElement("span")
  span.textContent = "|" // Cursor marker
  div.appendChild(span)
  
  const rect = textarea.getBoundingClientRect()
  const divRect = div.getBoundingClientRect()
  
  // Calculate position relative to textarea
  const top = rect.top + (divRect.height - rect.height) + textarea.scrollTop
  const left = rect.left + divRect.width
  
  document.body.removeChild(div)
  
  return { top, left }
}

/**
 * Get caret position using DOM Range API (viewport coordinates)
 * Creates a mirror div to use Range API since textarea doesn't support it directly
 */
export function getCaretRectFromSelection(textarea: HTMLTextAreaElement): DOMRect | null {
  const selectionStart = textarea.selectionStart
  const selectionEnd = textarea.selectionEnd
  
  // If there's a selection, use the end position
  const position = selectionEnd
  
  // Create a mirror div with same styling
  const mirror = document.createElement("div")
  const style = window.getComputedStyle(textarea)
  
  // Copy all relevant styles
  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.whiteSpace = style.whiteSpace || "pre-wrap"
  mirror.style.wordWrap = style.wordWrap || "break-word"
  mirror.style.font = style.font
  mirror.style.fontSize = style.fontSize
  mirror.style.fontFamily = style.fontFamily
  mirror.style.fontWeight = style.fontWeight
  mirror.style.lineHeight = style.lineHeight
  mirror.style.padding = style.padding
  mirror.style.border = style.border
  mirror.style.width = `${textarea.offsetWidth}px`
  mirror.style.letterSpacing = style.letterSpacing
  mirror.style.boxSizing = style.boxSizing
  
  document.body.appendChild(mirror)
  
  // Set text content up to cursor position
  const textBeforeCursor = textarea.value.substring(0, position)
  mirror.textContent = textBeforeCursor
  
  // Create a range at the end of the mirror content
  const range = document.createRange()
  const selection = window.getSelection()
  
  if (mirror.firstChild) {
    range.setStart(mirror.firstChild, Math.min(position, mirror.firstChild.textContent?.length || 0))
    range.setEnd(mirror.firstChild, Math.min(position, mirror.firstChild.textContent?.length || 0))
  } else {
    // Empty text, create a text node
    const textNode = document.createTextNode("")
    mirror.appendChild(textNode)
    range.setStart(textNode, 0)
    range.setEnd(textNode, 0)
  }
  
  // Get bounding rect (viewport coordinates)
  const rect = range.getBoundingClientRect()
  const textareaRect = textarea.getBoundingClientRect()
  
  // Calculate position relative to textarea, then convert to viewport
  const left = textareaRect.left + (rect.left - mirror.getBoundingClientRect().left)
  const top = textareaRect.top + (rect.top - mirror.getBoundingClientRect().top)
  const height = rect.height || parseFloat(style.lineHeight) || 20
  const width = 1 // Caret width
  
  document.body.removeChild(mirror)
  
  return new DOMRect(left, top, width, height)
}

/**
 * Get bounding rect of a specific character position in textarea (viewport coordinates)
 */
function getSlashCharacterRect(textarea: HTMLTextAreaElement, charPos: number): DOMRect | null {
  // Temporarily set selection to the character position
  const originalStart = textarea.selectionStart
  const originalEnd = textarea.selectionEnd
  
  textarea.setSelectionRange(charPos, charPos)
  const rect = getCaretRectFromSelection(textarea)
  
  // Restore original selection
  textarea.setSelectionRange(originalStart, originalEnd)
  
  if (rect) {
    // Adjust width to approximate "/" character width
    rect.width = 8
  }
  
  return rect
}

/**
 * Render text with marks as formatted React nodes
 * Handles overlapping marks by splitting text into segments at all mark boundaries
 */
function renderMarkedText(text: string, marks: MarkRange[] | undefined): React.ReactNode {
  if (!marks || marks.length === 0) {
    return text
  }

  // Get all unique positions where marks start or end
  const positions = new Set<number>()
  marks.forEach((range) => {
    positions.add(range.start)
    positions.add(range.end)
  })
  positions.add(0)
  positions.add(text.length)
  
  const sortedPositions = Array.from(positions).sort((a, b) => a - b)
  
  // Build segments - each segment represents a contiguous range with the same set of active marks
  const segments: Array<{ text: string; marks: string[] }> = []
  
  for (let i = 0; i < sortedPositions.length - 1; i++) {
    const start = sortedPositions[i]
    const end = sortedPositions[i + 1]
    
    if (start >= end) continue
    
    // Find all marks that completely cover this segment
    // A mark covers a segment if it starts at or before the segment start
    // and ends at or after the segment end
    const activeMarks = marks
      .filter((range) => range.start <= start && range.end >= end)
      .map((range) => range.type)
    
    segments.push({
      text: text.slice(start, end),
      marks: activeMarks,
    })
  }

  // Render segments with properly nested HTML tags
  // Nesting order: inner to outer (underline -> italic -> bold)
  // This ensures that if bold covers more text than italic, we get: <strong>text <em>overlap</em></strong>
  return segments.map((segment, index) => {
    if (!segment.text) return null
    
    let content: React.ReactNode = segment.text

    // Apply marks from inner to outer for proper nesting
    // Example: if bold(0-10) and italic(5-10), we want: <strong>text <em>overlap</em></strong>
    if (segment.marks.includes("underline")) {
      content = <u key={`underline-${index}`}>{content}</u>
    }
    if (segment.marks.includes("italic")) {
      content = <em key={`italic-${index}`}>{content}</em>
    }
    if (segment.marks.includes("bold")) {
      content = <strong key={`bold-${index}`}>{content}</strong>
    }

    return <span key={`segment-${index}`}>{content}</span>
  })
}

export function RichTextBlock({
  block,
  blockIndex = -1,
  allBlocks = [],
  isEditing,
  onStartEdit,
  onTextChange,
  onKeyDown,
  onRegisterRef,
  onBlur,
  onSelectionChange,
  onSlashCommand,
  onToggleTodo,
  placeholder,
  className = "",
  minHeight = 24,
  isSlashMenuOpen = false,
  isPlusButtonBlock = false,
}: RichTextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)
  const prevTextRef = useRef<string>(block.text)
  const selectionStartRef = useRef<number>(0)

  // Always register textarea ref with parent (for focusBlock to work)
  useEffect(() => {
    onRegisterRef(textareaRef.current)
    return () => {
      onRegisterRef(null)
    }
  }, [onRegisterRef])

  // Update prevText when block.text changes externally
  useEffect(() => {
    prevTextRef.current = block.text
  }, [block.text])

  const clickPositionRef = useRef<number | null>(null)

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Set cursor position if available (from click)
      if (clickPositionRef.current !== null) {
        const pos = Math.min(clickPositionRef.current, block.text.length)
        textareaRef.current.setSelectionRange(pos, pos)
        clickPositionRef.current = null
      }
    }
  }, [isEditing, block.text])

  // Enter edit mode when textarea receives focus (e.g., from keyboard navigation)
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!isEditing) {
      clickPositionRef.current = null
      onStartEdit(block.text.length) // Default to end
    }
  }


  // Check if textarea should be visible
  const shouldShowTextarea = isEditing

  // Track selection before changes
  const updateSelectionRef = () => {
    if (textareaRef.current) {
      selectionStartRef.current = textareaRef.current.selectionStart
    }
  }

  const handleDisplayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (displayRef.current) {
      // Calculate click position in text
      let clickPosition = block.text.length // Default to end
      
      try {
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
        if (range && displayRef.current.contains(range.commonAncestorContainer)) {
          // Count text nodes before the click
          const walker = document.createTreeWalker(
            displayRef.current,
            NodeFilter.SHOW_TEXT,
            null
          )
          let position = 0
          let node
          while ((node = walker.nextNode())) {
            if (node === range.startContainer || node.contains(range.startContainer)) {
              position += range.startOffset
              break
            }
            position += node.textContent?.length || 0
          }
          clickPosition = position
        }
      } catch (err) {
        // Fallback: estimate position based on click X
        const rect = displayRef.current.getBoundingClientRect()
        const relativeX = e.clientX - rect.left
        // Rough estimate: ~8px per character for 16px font
        clickPosition = Math.min(
          Math.floor(relativeX / 8),
          block.text.length
        )
      }
      
      clickPositionRef.current = clickPosition
      onStartEdit(clickPosition)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const prevText = prevTextRef.current
    const selectionStart = selectionStartRef.current

    // Update prevText for next change
    prevTextRef.current = newText

    // Update selection ref for next change
    updateSelectionRef()

    // Pass prevText and selectionStart for mark adjustment
    onTextChange(newText, prevText, selectionStart)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Capture selection before key is processed
    updateSelectionRef()
    
    // Detect slash command - ONLY "/" triggers, not "\"
    if (textareaRef.current && onSlashCommand) {
      const text = textareaRef.current.value
      const cursorPos = textareaRef.current.selectionStart
      const textBeforeCursor = text.slice(0, cursorPos)
      
      // Check if "/" was just typed (at start or after whitespace)
      const isSlashAtStart = textBeforeCursor === "/"
      const isSlashAfterWhitespace = textBeforeCursor.match(/\s\/$/)
      const isEmptyBlock = text.trim() === ""
      
      if (e.key === "/" && (isSlashAtStart || isSlashAfterWhitespace || isEmptyBlock)) {
        // Let "/" be inserted first, then calculate position using current caret
        setTimeout(() => {
          if (textareaRef.current && onSlashCommand) {
            // Use current caret position (at cursor after "/")
            const anchorRect = getCaretRectFromSelection(textareaRef.current)
            
            if (anchorRect) {
              // Query starts empty right after "/"
              onSlashCommand(block.id, anchorRect, "")
            }
          }
        }, 0)
      }
    }
    
    if (textareaRef.current) {
      onKeyDown(e, textareaRef.current)
    }
  }
  
  // Monitor text changes to update query or close menu
  // This runs after handleChange updates the text
  const prevTextRefForSlash = useRef<string>(block.text)
  useEffect(() => {
    if (isEditing && textareaRef.current && onSlashCommand) {
      const text = textareaRef.current.value
      const cursorPos = textareaRef.current.selectionStart
      const textBeforeCursor = text.slice(0, cursorPos)
      
      // Check if there's a "/" command pattern (at start or after whitespace)
      const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/)([^\s]*)$/)
      
      if (slashMatch) {
        // "/" is present, update query
        const query = slashMatch[2] || "" // Text after "/"
        // Use current caret position (at cursor) for menu anchoring
        const anchorRect = getCaretRectFromSelection(textareaRef.current)
        if (anchorRect) {
          onSlashCommand(block.id, anchorRect, query)
        }
      }
      
      prevTextRefForSlash.current = text
    }
  }, [block.text, isEditing, onSlashCommand, block.id])

  const handleSelect = () => {
    updateSelectionRef()
    // Notify parent of selection change
    if (isEditing && textareaRef.current && onSelectionChange) {
      onSelectionChange(textareaRef.current)
    }
  }

  const handleMouseUp = () => {
    // Also check selection on mouseup (for drag selections)
    if (isEditing && textareaRef.current && onSelectionChange) {
      // Small delay to ensure selection is updated
      setTimeout(() => {
        if (textareaRef.current) {
          onSelectionChange(textareaRef.current)
        }
      }, 0)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Hide toolbar on blur (unless clicking on toolbar itself)
    if (onSelectionChange && textareaRef.current) {
      // Use setTimeout to check if focus moved to toolbar
      setTimeout(() => {
        const activeElement = document.activeElement
        // Hide toolbar if focus is not on textarea and not on toolbar
        const isToolbarClick =
          activeElement?.closest('[class*="SelectionToolbar"]') !== null
        if (
          activeElement !== textareaRef.current &&
          !isToolbarClick &&
          textareaRef.current
        ) {
          onSelectionChange(textareaRef.current)
        }
      }, 150)
    }
    onBlur()
  }

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`
    }
  }, [block.text, isEditing, minHeight])

  // Always render textarea (hidden when not editing) so it can be focused
  // Display mode overlay when not editing
  const isEmpty = block.text.trim() === ""
  
  // Render checkbox for todo blocks (used in both display and edit modes)
  const renderTodoCheckbox = () => {
    if (block.type !== "todo") return null
    
    return (
      <input
        type="checkbox"
        checked={block.checked || false}
        onChange={(e) => {
          e.stopPropagation()
          if (onToggleTodo) {
            onToggleTodo(block.id)
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
        className="mt-0.5 flex-shrink-0 w-4 h-4 cursor-pointer"
      />
    )
  }
  
  // Render display content based on block type
  const renderDisplayContent = () => {
    // Handle divider blocks (no visual rendering - just empty space)
    if (block.type === "divider") {
      return null
    }
    
    // Handle todo blocks with checkbox (always show checkbox, even when empty)
    if (block.type === "todo") {
      return (
        <div className="flex items-start gap-2">
          {renderTodoCheckbox()}
          <div className={`flex-1 leading-[28px] ${block.checked ? "line-through text-gray-500" : ""}`}>
            {isEmpty ? (
              <span className="text-gray-400">{placeholder || ""}</span>
            ) : (
              renderMarkedText(block.text, block.marks?.ranges)
            )}
          </div>
        </div>
      )
    }
    
    // Handle empty blocks (non-todo)
    if (isEmpty) {
      return <span className="text-gray-400">{placeholder || ""}</span>
    }
    
    // Handle headings with different sizes
    if (block.type === "heading1") {
      return (
        <div className="text-[24px] font-semibold text-gray-900 leading-[1.3]">
          {renderMarkedText(block.text, block.marks?.ranges)}
        </div>
      )
    }
    
    if (block.type === "heading2") {
      return (
        <div className="text-[20px] font-semibold text-gray-900 leading-[1.4]">
          {renderMarkedText(block.text, block.marks?.ranges)}
        </div>
      )
    }
    
    if (block.type === "heading3") {
      return (
        <div className="text-[18px] font-semibold text-gray-900 leading-[1.4]">
          {renderMarkedText(block.text, block.marks?.ranges)}
        </div>
      )
    }
    
    // Handle bulleted list - fixed marker column (24px) + text column
    if (block.type === "bulleted") {
      return (
        <div className="flex items-start text-[16px] text-gray-700 leading-[28px]">
          <div className="flex-shrink-0 w-6 flex items-center justify-start">
            <span className="mt-1.5 text-gray-500">•</span>
          </div>
          <div className="flex-1 min-w-0">{renderMarkedText(block.text, block.marks?.ranges)}</div>
        </div>
      )
    }
    
    // Handle numbered list - fixed marker column (24px) + text column
    if (block.type === "numbered") {
      return (
        <div className="flex items-start text-[16px] text-gray-700 leading-[28px]">
          <div className="flex-shrink-0 w-6 flex items-center justify-end">
            <span className="mt-1.5 text-gray-500 text-right">1.</span>
          </div>
          <div className="flex-1 min-w-0">{renderMarkedText(block.text, block.marks?.ranges)}</div>
        </div>
      )
    }
    
    // Handle callout blocks
    if (block.type === "callout") {
      return (
        <div
          style={{
            display: "flex",
            width: "100%",
            borderRadius: "10px",
            border: "1px solid transparent",
            background: "rgb(241, 241, 239)",
            paddingInline: "12px 20px",
            paddingTop: "16px",
            paddingBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "24px",
              width: "24px",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "21.6px", lineHeight: 1 }}>{block.icon || "💡"}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              marginInlineStart: "8px",
              width: "100%",
              fontSize: "16px",
              lineHeight: 1.5,
            }}
          >
            {renderMarkedText(block.text, block.marks?.ranges)}
          </div>
        </div>
      )
    }

    // Handle bookmark blocks
    if (block.type === "bookmark") {
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            color: "inherit",
            textDecoration: "none",
            userSelect: "none",
            transition: "background 20ms ease-in",
            cursor: "pointer",
            flexGrow: 1,
            minWidth: 0,
            flexWrap: "wrap-reverse",
            alignItems: "stretch",
            textAlign: "start",
            overflow: "hidden",
            border: "1px solid rgba(55, 53, 47, 0.16)",
            borderRadius: "10px",
            position: "relative",
            fill: "inherit",
          }}
        >
          <div
            style={{
              flex: "4 1 180px",
              padding: "12px 14px 14px",
              overflow: "hidden",
              textAlign: "start",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                lineHeight: "20px",
                color: "#37352f",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minHeight: "24px",
                marginBottom: "2px",
              }}
            >
              {block.title || block.url}
            </div>
            {block.description && (
              <div
                style={{
                  fontSize: "12px",
                  lineHeight: "16px",
                  color: "#6b6b6b",
                  height: "32px",
                  overflow: "hidden",
                }}
              >
                {block.description}
              </div>
            )}
            <div style={{ display: "flex", marginTop: "6px" }}>
              <div
                style={{
                  fontSize: "12px",
                  lineHeight: "16px",
                  color: "#37352f",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {block.url}
              </div>
            </div>
          </div>
          {block.imageUrl && (
            <div style={{ flex: "1 1 180px", display: "block", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, insetInline: 0, bottom: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src={block.imageUrl}
                  style={{
                    display: "block",
                    objectFit: "cover",
                    borderRadius: "2px",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            </div>
          )}
        </a>
      )
    }

    // Handle page/sub-page blocks
    if (block.type === "page") {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            padding: "3px 2px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "24px",
              height: "24px",
              marginInlineEnd: "4px",
            }}
          >
            <svg
              viewBox="4.12 2.37 11.75 15.25"
              style={{
                width: "19.8px",
                height: "19.8px",
                display: "block",
                fill: "rgba(55, 53, 47, 0.45)",
                flexShrink: 0,
              }}
            >
              <path d="M13.3 14.25a.55.55 0 0 1-.55.55h-5.5a.55.55 0 1 1 0-1.1h5.5a.55.55 0 0 1 .55.55m-.55-1.95a.55.55 0 1 0 0-1.1h-5.5a.55.55 0 0 0 0 1.1z"></path>
              <path d="M6.25 2.375A2.125 2.125 0 0 0 4.125 4.5v11c0 1.174.951 2.125 2.125 2.125h7.5a2.125 2.125 0 0 0 2.125-2.125V8.121c0-.563-.224-1.104-.622-1.502L11.63 2.997a2.13 2.13 0 0 0-1.502-.622zM5.375 4.5c0-.483.392-.875.875-.875h3.7V6.25A2.05 2.05 0 0 0 12 8.3h2.625v7.2a.875.875 0 0 1-.875.875h-7.5a.875.875 0 0 1-.875-.875zm8.691 2.7H12a.95.95 0 0 1-.95-.95V4.184z"></path>
            </svg>
          </div>
          <span
            style={{
              overflow: "auto",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              fontWeight: 500,
              lineHeight: 1.3,
              borderBottom: "1px solid rgba(55, 53, 47, 0.16)",
            }}
          >
            {block.text}
          </span>
        </div>
      )
    }
    
    // Default paragraph rendering with tight line-height
    return (
      <div className="text-[16px] text-gray-700 leading-[28px]">
        {renderMarkedText(block.text, block.marks?.ranges)}
      </div>
    )
  }
  
  const displayContent = renderDisplayContent()
  
  // Divider blocks don't render anything - they're invisible
  if (block.type === "divider") {
    return null
  }

  // For list items (bulleted/numbered), use two-column layout: marker column + text column
  const isListItem = block.type === "bulleted" || block.type === "numbered"
  
  // Compute number for numbered list items
  const getNumberedListNumber = (): number => {
    if (block.type !== "numbered" || blockIndex === -1 || allBlocks.length === 0) {
      return 1
    }
    
    // Walk backwards to find the start of this consecutive numbered list run
    let startIndex = blockIndex
    for (let i = blockIndex - 1; i >= 0; i--) {
      if (allBlocks[i].type === "numbered") {
        startIndex = i
      } else {
        break
      }
    }
    
    // Number = (currentIndex - startIndex) + 1
    return (blockIndex - startIndex) + 1
  }

  // Render marker column for list items
  const renderMarkerColumn = () => {
    if (!isListItem) return null
    
    return (
      <div className="flex-shrink-0 w-6 flex items-center pt-1">
        {block.type === "bulleted" ? (
          <span className="text-gray-500">•</span>
        ) : (
          <span className="text-gray-500 text-right w-full">{getNumberedListNumber()}.</span>
        )}
      </div>
    )
  }

  // If it's a list item, wrap in two-column layout
  if (isListItem) {
    return (
      <div className="flex items-start gap-2">
        {/* Marker column - fixed width, contains bullet/number */}
        {renderMarkerColumn()}
        
        {/* Text column - contains textarea, display overlay, placeholder */}
        <div className="flex-1 min-w-0 relative">
          {/* For todo blocks, show checkbox in edit mode */}
          {shouldShowTextarea && block.type === "todo" && (
            <div className="absolute left-0 top-0 z-40 pt-1">
              <input
                type="checkbox"
                checked={block.checked || false}
                onChange={(e) => {
                  e.stopPropagation()
                  if (onToggleTodo) {
                    onToggleTodo(block.id)
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className="flex-shrink-0 w-4 h-4 cursor-pointer"
              />
            </div>
          )}
          
          {/* Formatted mirror overlay - shown behind textarea when editing */}
          {shouldShowTextarea && (
            <div
              className={`${className} absolute inset-0 z-10 pointer-events-none ${
                block.type === "heading1" || block.type === "heading2" || block.type === "heading3" 
                  ? "text-gray-900" 
                  : "text-gray-700"
              }`}
              style={{
                minHeight: `${minHeight}px`,
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                lineHeight: 
                  block.type === "heading1" ? "1.3" :
                  block.type === "heading2" ? "1.4" :
                  block.type === "heading3" ? "1.4" :
                  "28px",
                padding: 0,
                margin: 0,
                border: "none",
                overflow: "hidden",
                listStyle: "none",
                listStylePosition: "outside",
              }}
            >
              {renderMarkedText(block.text, block.marks?.ranges)}
            </div>
          )}
          
          {/* Textarea - always rendered, visible when editing, invisible when not */}
          <textarea
            ref={textareaRef}
            data-editable="true"
            value={block.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onMouseUp={handleMouseUp}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={0}
            className={`${className} ${shouldShowTextarea ? "relative z-30 bg-transparent text-transparent" : "absolute inset-0 opacity-0 z-20"} ${
              block.type === "todo" && shouldShowTextarea ? "pl-6" : ""
            }`}
            style={{
              fontFamily: "inherit",
              minHeight: `${minHeight}px`,
              caretColor: shouldShowTextarea ? "#111827" : "transparent",
              listStyle: "none",
              listStylePosition: "outside",
              margin: 0,
            }}
            rows={1}
          />
          
          {/* Notion-like placeholder - shows when empty and (slash menu is not open OR it's a + button block) */}
          {isEmpty && (!isSlashMenuOpen || isPlusButtonBlock) && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                if (textareaRef.current && !isEditing) {
                  onStartEdit(0)
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus()
                      textareaRef.current.setSelectionRange(0, 0)
                    }
                  }, 0)
                } else if (textareaRef.current && isEditing) {
                  textareaRef.current.focus()
                  textareaRef.current.setSelectionRange(0, 0)
                }
              }}
              className="absolute left-0 top-0 z-25 cursor-text select-none pointer-events-auto"
              style={{
                fontFamily: "inherit",
                minHeight: `${minHeight}px`,
                lineHeight: 
                  block.type === "heading1" ? "1.3" :
                  block.type === "heading2" ? "1.4" :
                  block.type === "heading3" ? "1.4" :
                  "28px",
                fontSize: block.type === "heading1" ? "24px" :
                         block.type === "heading2" ? "20px" :
                         block.type === "heading3" ? "18px" :
                         "16px",
                fontWeight: (block.type === "heading1" || block.type === "heading2" || block.type === "heading3") ? "600" : "400",
              }}
            >
              <span className="text-gray-400">{placeholder || "Press '/' for commands"}</span>
            </div>
          )}

          {/* Display overlay - shown when not editing (for list items, only render text, marker is in marker column) */}
          {!shouldShowTextarea && (
            <div
              ref={displayRef}
              onClick={handleDisplayClick}
              className={`${className} cursor-text select-text relative z-10`}
              style={{
                minHeight: `${minHeight}px`,
                pointerEvents: "auto",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                lineHeight: "28px",
              }}
              onMouseDown={(e) => {
                if (textareaRef.current) {
                  textareaRef.current.style.pointerEvents = "auto"
                  setTimeout(() => {
                    if (textareaRef.current && !isEditing) {
                      textareaRef.current.style.pointerEvents = "auto"
                    }
                  }, 0)
                }
              }}
            >
              {renderMarkedText(block.text, block.marks?.ranges)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Non-list blocks use the original structure
  return (
    <div className="relative">
      {/* For todo blocks, show checkbox in edit mode */}
      {shouldShowTextarea && block.type === "todo" && (
        <div className="absolute left-0 top-0 z-40 pt-1">
          <input
            type="checkbox"
            checked={block.checked || false}
            onChange={(e) => {
              e.stopPropagation()
              if (onToggleTodo) {
                onToggleTodo(block.id)
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="flex-shrink-0 w-4 h-4 cursor-pointer"
          />
        </div>
      )}
      
      {/* Formatted mirror overlay - shown behind textarea when editing */}
      {shouldShowTextarea && (
        <div
          className={`${className} absolute inset-0 z-10 pointer-events-none ${
            block.type === "heading1" || block.type === "heading2" || block.type === "heading3" 
              ? "text-gray-900" 
              : "text-gray-700"
          }`}
          style={{
            minHeight: `${minHeight}px`,
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            lineHeight: 
              block.type === "heading1" ? "1.3" :
              block.type === "heading2" ? "1.4" :
              block.type === "heading3" ? "1.4" :
              "28px",
            padding: 0,
            margin: 0,
            border: "none",
            overflow: "hidden",
            // Ensure list items don't get browser default list styling
            listStyle: "none",
            listStylePosition: "outside",
          }}
        >
          {block.type === "todo" ? (
            <div className="flex items-start gap-2 pl-6">
              <div className="w-4 h-4 flex-shrink-0 mt-0.5" /> {/* Spacer for checkbox, aligned */}
              <div className={`flex-1 leading-[28px] ${block.checked ? "line-through text-gray-500" : ""}`}>
                {renderMarkedText(block.text, block.marks?.ranges)}
              </div>
            </div>
          ) : block.type === "bulleted" ? (
            <div className="flex items-start" style={{ margin: 0, padding: 0 }}>
              <div className="flex-shrink-0 w-6 flex items-center justify-start" style={{ margin: 0, padding: 0 }}>
                <span className="mt-1.5 text-gray-500">•</span>
              </div>
              <div className="flex-1 min-w-0 leading-[28px]" style={{ margin: 0, padding: 0 }}>{renderMarkedText(block.text, block.marks?.ranges)}</div>
            </div>
          ) : block.type === "numbered" ? (
            <div className="flex items-start" style={{ margin: 0, padding: 0 }}>
              <div className="flex-shrink-0 w-6 flex items-center justify-end" style={{ margin: 0, padding: 0 }}>
                <span className="mt-1.5 text-gray-500 text-right">1.</span>
              </div>
              <div className="flex-1 min-w-0 leading-[28px]" style={{ margin: 0, padding: 0 }}>{renderMarkedText(block.text, block.marks?.ranges)}</div>
            </div>
          ) : (
            renderMarkedText(block.text, block.marks?.ranges)
          )}
        </div>
      )}
      
      {/* Textarea - always rendered, visible when editing, invisible when not */}
      <textarea
        ref={textareaRef}
        data-editable="true"
        value={block.text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onMouseUp={handleMouseUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        className={`${className} ${shouldShowTextarea ? "relative z-30 bg-transparent text-transparent" : "absolute inset-0 opacity-0 z-20"} ${
          block.type === "todo" && shouldShowTextarea ? "pl-6" : ""
        }`}
        style={{
          fontFamily: "inherit",
          minHeight: `${minHeight}px`,
          caretColor: shouldShowTextarea ? "#111827" : "transparent", // gray-900 for visible caret
          // Ensure list items don't get browser default list styling or accumulate margins
          listStyle: "none",
          listStylePosition: "outside",
          margin: 0,
        }}
        rows={1}
      />
      
      {/* Notion-like placeholder - shows when empty and (slash menu is not open OR it's a + button block) */}
      {isEmpty && (!isSlashMenuOpen || isPlusButtonBlock) && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            if (textareaRef.current && !isEditing) {
              onStartEdit(0)
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.focus()
                  textareaRef.current.setSelectionRange(0, 0)
                }
              }, 0)
            } else if (textareaRef.current && isEditing) {
              textareaRef.current.focus()
              textareaRef.current.setSelectionRange(0, 0)
            }
          }}
          className="absolute left-0 top-0 z-25 cursor-text select-none pointer-events-auto"
          style={{
            fontFamily: "inherit",
            minHeight: `${minHeight}px`,
            lineHeight: 
              block.type === "heading1" ? "1.3" :
              block.type === "heading2" ? "1.4" :
              block.type === "heading3" ? "1.4" :
              "28px",
            fontSize: block.type === "heading1" ? "24px" :
                     block.type === "heading2" ? "20px" :
                     block.type === "heading3" ? "18px" :
                     "16px",
            fontWeight: (block.type === "heading1" || block.type === "heading2" || block.type === "heading3") ? "600" : "400",
          }}
        >
          {/* Render placeholder with proper list marker spacing */}
          {block.type === "bulleted" ? (
            <div className="flex items-start text-[16px] text-gray-700 leading-[28px]">
              <div className="flex-shrink-0 w-6 flex items-center justify-start">
                <span className="mt-1.5 text-gray-500">•</span>
              </div>
              <div className="flex-1 min-w-0 text-gray-400">{placeholder || "Press '/' for commands"}</div>
            </div>
          ) : block.type === "numbered" ? (
            <div className="flex items-start text-[16px] text-gray-700 leading-[28px]">
              <div className="flex-shrink-0 w-6 flex items-center justify-end">
                <span className="mt-1.5 text-gray-500 text-right">1.</span>
              </div>
              <div className="flex-1 min-w-0 text-gray-400">{placeholder || "Press '/' for commands"}</div>
            </div>
          ) : block.type === "todo" ? (
            <div className="flex items-start gap-2 pl-6">
              <div className="w-4 h-4 flex-shrink-0 mt-0.5" /> {/* Spacer for checkbox */}
              <span className="flex-1 text-gray-400 leading-[28px]">{placeholder || "Press '/' for commands"}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder || "Press '/' for commands"}</span>
          )}
        </div>
      )}
      
      {/* Display overlay - shown when not editing, positioned above textarea but allows focus */}
      {!shouldShowTextarea && (
        <div
          ref={displayRef}
          onClick={handleDisplayClick}
          className={`${className} cursor-text select-text relative z-10`}
          style={{
            minHeight: `${minHeight}px`,
            pointerEvents: "auto",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            lineHeight: block.type === "heading1" ? "1.3" : "28px",
          }}
          onMouseDown={(e) => {
            // Temporarily allow textarea to receive focus
            if (textareaRef.current) {
              textareaRef.current.style.pointerEvents = "auto"
              setTimeout(() => {
                if (textareaRef.current && !isEditing) {
                  textareaRef.current.style.pointerEvents = "auto"
                }
              }, 0)
            }
          }}
        >
          {displayContent}
        </div>
      )}
    </div>
  )
}
