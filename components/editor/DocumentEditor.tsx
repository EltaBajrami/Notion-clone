"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Doc } from "@/lib/types"
import { updateDocumentTitle } from "@/lib/doc"
import {
  splitBlockAtCursor,
  mergeWithPrev,
  deleteBlock,
  updateBlockText,
  getPreviousBlockId,
  getNextBlockId,
  moveBlock,
  convertBlockType,
} from "@/lib/doc-ops"
import { createBlock } from "@/lib/doc"
import { BlockRow } from "./BlockRow"
import { SelectionToolbar } from "./SelectionToolbar"
import { SlashMenu, SLASH_COMMANDS, SlashMenuCommand } from "./SlashMenu"
import { getCaretRectFromSelection } from "./RichTextBlock"
import { toggleMark, MarkType } from "@/lib/marks"
import { BlockType } from "@/lib/types"

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

interface DocumentEditorProps {
  doc: Doc
  onChange: (nextDoc: Doc) => void
  onTitleChange?: (newTitle: string) => void // Callback to sync page.title in sidebar
  autoFocusTarget?: "title" | { blockId: string }
  onTitleFocusComplete?: () => void // Callback when title focus is complete
}

export function DocumentEditor({
  doc,
  onChange,
  onTitleChange,
  autoFocusTarget,
  onTitleFocusComplete,
}: DocumentEditorProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const blockRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const blocksContainerRef = useRef<HTMLDivElement>(null)
  
  // Selection toolbar state
  const [toolbarState, setToolbarState] = useState<{
    activeBlockId: string | null
    selectionStart: number
    selectionEnd: number
    position: { top: number; left: number } | null
  }>({
    activeBlockId: null,
    selectionStart: 0,
    selectionEnd: 0,
    position: null,
  })
  
  // Ref to store latest toolbar state for reliable access in callbacks
  const toolbarStateRef = useRef(toolbarState)
  useEffect(() => {
    toolbarStateRef.current = toolbarState
  }, [toolbarState])

  // Slash menu state
  const [slashMenuState, setSlashMenuState] = useState<{
    blockId: string
    anchorRect: DOMRect | null
    query: string
    activeIndex: number
  } | null>(null)

  // Track blocks created via + button (for "Type to filter" placeholder)
  const plusButtonBlocksRef = useRef<Set<string>>(new Set())

  // Gutter controls state - tracks which block's gutter is active
  const [activeGutterBlockId, setActiveGutterBlockId] = useState<string | null>(null)
  
  // Track typing state per block
  const typingBlocksRef = useRef<Set<string>>(new Set())

  // Register/unregister block refs
  const registerBlockRef = useCallback((blockId: string, ref: HTMLTextAreaElement | null) => {
    if (ref) {
      blockRefs.current.set(blockId, ref)
    } else {
      blockRefs.current.delete(blockId)
    }
  }, [])

  // Focus a block by ID
  const focusBlock = useCallback((blockId: string, position?: number) => {
    const blockRef = blockRefs.current.get(blockId)
    if (blockRef) {
      blockRef.focus()
      if (position !== undefined) {
        blockRef.setSelectionRange(position, position)
      } else {
        const length = blockRef.value.length
        blockRef.setSelectionRange(length, length)
      }
    }
  }, [])

  /**
   * Get caret rect with retries - ensures caret selection rect exists before returning
   * Focuses the block's editable element, sets caret at start, and reads the rect
   * Verifies that window.getSelection() is inside the editable element before resolving
   * Retries up to 3 times if rect is empty or selection not verified, then falls back to editable element rect
   */
  const getCaretRectWithRetries = useCallback(
    (blockId: string, retryCount = 0): Promise<DOMRect> => {
      return new Promise((resolve) => {
        // Find the editable element using data attributes
        const blockRow = document.querySelector(`[data-block-id="${blockId}"]`)
        if (!blockRow) {
          // If block row not found, try using blockRefs as fallback
          const textarea = blockRefs.current.get(blockId)
          if (textarea) {
            textarea.focus()
            textarea.setSelectionRange(0, 0)
            // Verify selection is in the textarea (for textarea, check if it's the active element)
            if (document.activeElement === textarea) {
              const rect = textarea.getBoundingClientRect()
              resolve(new DOMRect(rect.left, rect.top, 1, rect.height || 20))
              return
            }
          }
          // If selection not verified, retry or return fallback
          if (retryCount < 3) {
            requestAnimationFrame(() => {
              getCaretRectWithRetries(blockId, retryCount + 1).then(resolve)
            })
            return
          }
          // Last resort: return empty rect
          resolve(new DOMRect(0, 0, 1, 20))
          return
        }

        const editable = blockRow.querySelector<HTMLTextAreaElement>('[data-editable="true"]')
        if (!editable) {
          // Fallback to blockRefs
          const textarea = blockRefs.current.get(blockId)
          if (textarea) {
            textarea.focus()
            textarea.setSelectionRange(0, 0)
            // Verify selection is in the textarea
            if (document.activeElement === textarea) {
              const rect = textarea.getBoundingClientRect()
              resolve(new DOMRect(rect.left, rect.top, 1, rect.height || 20))
              return
            }
          }
          // If selection not verified, retry or return fallback
          if (retryCount < 3) {
            requestAnimationFrame(() => {
              getCaretRectWithRetries(blockId, retryCount + 1).then(resolve)
            })
            return
          }
          resolve(new DOMRect(0, 0, 1, 20))
          return
        }

        // Focus the editable element and set caret at start
        // This should trigger edit mode via handleFocus -> onStartEdit
        editable.focus()
        editable.setSelectionRange(0, 0)
        
        // Wait a moment for edit mode to be triggered and textarea to become visible
        // The textarea needs to be in edit mode (visible) for accurate positioning
        if (retryCount === 0) {
          // First attempt: wait for edit mode to activate
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              getCaretRectWithRetries(blockId, retryCount + 1).then(resolve)
            })
          })
          return
        }

        // Verify that window.getSelection() is inside the editable element
        const sel = window.getSelection()
        let isSelectionInEditable = false
        if (sel && sel.rangeCount > 0 && sel.anchorNode) {
          // Check if anchorNode is contained within the editable element
          isSelectionInEditable = editable.contains(sel.anchorNode)
        }
        // Also check if the editable is the active element (for textarea, this is the primary check)
        const isEditableActive = document.activeElement === editable

        // If selection is not verified, retry
        if (!isSelectionInEditable && !isEditableActive) {
          if (retryCount < 3) {
            requestAnimationFrame(() => {
              getCaretRectWithRetries(blockId, retryCount + 1).then(resolve)
            })
            return
          }
          // After retries, fallback to editable element rect (text column)
          const rect = editable.getBoundingClientRect()
          resolve(new DOMRect(rect.left, rect.top, 1, rect.height || 20))
          return
        }

        // Read caret rect using getCaretRectFromSelection
        const initialCaretRect = getCaretRectFromSelection(editable)
        const style = window.getComputedStyle(editable)
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5 || 20
        const textareaRect = editable.getBoundingClientRect()

        // For empty textareas or when caret rect is invalid, use textarea's position
        // The caret should be at the left edge of the text column (textarea left) and top of first line
        const isEmpty = editable.value.length === 0
        const isInvalidRect = !initialCaretRect || initialCaretRect.width === 0 || initialCaretRect.height === 0
        
        let caretRect: DOMRect
        if (isEmpty || isInvalidRect) {
          // Use textarea's bounding rect as base, positioned at start of first line
          // Left: textarea's left edge (already in text column, accounts for gutter)
          // Top: textarea's top (first line)
          // Height: line height (so bottom is at bottom of first line)
          caretRect = new DOMRect(
            textareaRect.left,
            textareaRect.top,
            1, // Caret width
            lineHeight
          )
        } else {
          // Ensure the rect has proper height representing the line height
          // This ensures anchorRect.bottom (which is top + height) is at the bottom of the line
          if (initialCaretRect.height < lineHeight * 0.5) {
            // Adjust height to match line height so bottom is correct
            caretRect = new DOMRect(
              initialCaretRect.left,
              initialCaretRect.top,
              initialCaretRect.width,
              lineHeight
            )
          } else {
            caretRect = initialCaretRect
          }
          
          // Ensure left position is aligned with textarea's left edge (text column)
          // This ensures menu appears aligned with text, not offset to the right
          // Allow small differences (up to 5px) for padding/margin, but correct larger offsets
          const leftDiff = Math.abs(caretRect.left - textareaRect.left)
          if (leftDiff > 5) {
            // Correct the left position to align with text column
            caretRect = new DOMRect(
              textareaRect.left,
              caretRect.top,
              caretRect.width,
              caretRect.height
            )
          }
        }

        // Check if rect is valid (non-empty) and selection is verified
        // Only resolve if selection is confirmed to be inside the editable element
        if (caretRect && caretRect.width > 0 && caretRect.height > 0 && (isSelectionInEditable || isEditableActive)) {
          resolve(caretRect)
          return
        }

        // If rect is empty and we haven't exceeded retries, retry with requestAnimationFrame
        if (retryCount < 3) {
          requestAnimationFrame(() => {
            getCaretRectWithRetries(blockId, retryCount + 1).then(resolve)
          })
          return
        }

        // After retries, fallback to editable element rect (text column)
        const rect = editable.getBoundingClientRect()
        resolve(new DOMRect(rect.left, rect.top, 1, rect.height || 20))
      })
    },
    []
  )

  // Auto-focus title if requested
  useEffect(() => {
    if (autoFocusTarget === "title" && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
      // Notify parent that focus is complete
      if (onTitleFocusComplete) {
        setTimeout(() => {
          onTitleFocusComplete()
        }, 0)
      }
    }
  }, [autoFocusTarget, onTitleFocusComplete])

  // Auto-focus block if requested
  useEffect(() => {
    if (
      autoFocusTarget &&
      typeof autoFocusTarget === "object" &&
      autoFocusTarget.blockId
    ) {
      focusBlock(autoFocusTarget.blockId)
    }
  }, [autoFocusTarget, focusBlock])

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value
    const updatedDoc = updateDocumentTitle(doc, newTitle)
    onChange(updatedDoc)
    // Sync to page.title in sidebar (real-time)
    // Sync the actual value - sidebar will use getDisplayTitle to show "Untitled" for empty
    if (onTitleChange) {
      onTitleChange(newTitle)
    }
  }

  const handleTitleBlur = () => {
    // Trim title and default to "Untitled" if empty
    const trimmedTitle = doc.title.trim()
    const finalTitle = trimmedTitle || "Untitled"
    
    if (finalTitle !== doc.title) {
      const updatedDoc = updateDocumentTitle(doc, finalTitle)
      onChange(updatedDoc)
      // Sync to page.title in sidebar
      if (onTitleChange) {
        onTitleChange(finalTitle)
      }
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter: Move focus to first block (no newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const firstBlock = doc.blocks[0]
      if (firstBlock) {
        focusBlock(firstBlock.id, 0)
      }
    }
  }

  const handleBlockChange = useCallback((blockId: string, newText: string, prevText?: string, selectionStart?: number) => {
    const updatedDoc = updateBlockText(doc, blockId, newText, prevText, selectionStart)
    onChange(updatedDoc)
    
    // Update slash menu query if menu is open for this block
    if (slashMenuState && slashMenuState.blockId === blockId) {
      const textarea = blockRefs.current.get(blockId)
      if (textarea) {
        const cursorPos = textarea.selectionStart
        const textBeforeCursor = newText.slice(0, cursorPos)
        const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/)
        
        // Check if this block was created via + button (no "/" required)
        const isPlusButtonBlock = plusButtonBlocksRef.current.has(blockId)
        
        if (slashMatch) {
          // Traditional "/" command - update query from text after "/"
          const query = slashMatch[2] || ""
          const anchorRect = getCaretRectFromSelection(textarea)
          if (anchorRect) {
            setSlashMenuState({
              blockId,
              anchorRect,
              query,
              activeIndex: 0, // Reset selection when query changes
            })
          }
        } else if (isPlusButtonBlock) {
          // Block created via + button - use entire text as query (no "/" needed)
          const query = newText.trim()
          const anchorRect = getCaretRectFromSelection(textarea)
          if (anchorRect) {
            setSlashMenuState({
              blockId,
              anchorRect,
              query,
              activeIndex: 0, // Reset selection when query changes
            })
          }
        } else {
          // No "/" and not a + button block - close menu
          setSlashMenuState(null)
        }
      }
    }
  }, [doc, onChange, slashMenuState])

  // Handle selection changes from textarea
  const handleSelectionChange = useCallback(
    (blockId: string, textarea: HTMLTextAreaElement) => {
      // Guard against null textarea
      if (!textarea) {
        return
      }
      
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      
      // Check if user is clicking on toolbar (don't clear toolbar in this case)
      const isClickingToolbar = document.activeElement?.closest('[class*="SelectionToolbar"]') !== null
      
      // Only show toolbar if there's a selection and textarea is focused
      // OR if there's a valid selection stored and user is clicking toolbar
      if (selectionStart !== selectionEnd && (document.activeElement === textarea || isClickingToolbar)) {
        const rect = textarea.getBoundingClientRect()
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft
        
        // Calculate position above selection
        // Position near top-center of textarea for simplicity
        // A more sophisticated approach would calculate based on selectionStart/End positions
        const top = rect.top + scrollTop - 45 // 45px above textarea
        const left = rect.left + scrollLeft + rect.width / 2 // Center of textarea
        
        setToolbarState({
          activeBlockId: blockId,
          selectionStart,
          selectionEnd,
          position: { top, left },
        })
      } else if (!isClickingToolbar) {
        // Hide toolbar when selection is cleared or textarea loses focus
        // But NOT if user is clicking on toolbar
        setToolbarState((prev) => {
          // Only clear if we're not in the middle of a toolbar interaction
          // Keep the state if there was a valid selection before
          if (prev.activeBlockId === blockId && prev.selectionStart !== prev.selectionEnd) {
            // Keep the previous state if selection collapsed but we might restore it
            return prev
          }
          return {
            activeBlockId: null,
            selectionStart: 0,
            selectionEnd: 0,
            position: null,
          }
        })
      }
    },
    []
  )

  // Open command menu at the current selection/caret position
  // Computes anchorRect from selection range, not from button click position
  const openCommandMenuAtSelection = useCallback(
    (blockId: string, retryCount = 0) => {
      const textarea = blockRefs.current.get(blockId)
      if (!textarea) {
        // If textarea not available yet, retry on next frame
        if (retryCount < 2) {
          requestAnimationFrame(() => {
            openCommandMenuAtSelection(blockId, retryCount + 1)
          })
        }
        return
      }
      
      // Compute anchorRect from selection range (primary method)
      // For textareas, getCaretRectFromSelection computes from the textarea's internal selection
      // which is the equivalent of window.getSelection() for contenteditable elements
      let anchorRect = getCaretRectFromSelection(textarea)
      
      // Also try window.getSelection() as a fallback (works for contenteditable elements)
      if (!anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)) {
        const sel = window.getSelection()
        const range = sel?.rangeCount ? sel.getRangeAt(0) : null
        if (range) {
          const rect = range.getBoundingClientRect()
          if (rect && (rect.width > 0 || rect.height > 0)) {
            anchorRect = rect
          }
        }
      }
      
      // If selection rect is still empty, retry on next frame (max 2 retries)
      if (!anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)) {
        if (retryCount < 2) {
          requestAnimationFrame(() => {
            openCommandMenuAtSelection(blockId, retryCount + 1)
          })
          return
        }
        
        // After retries, fallback to textarea's bounding rect at text column start
        const rect = textarea.getBoundingClientRect()
        anchorRect = new DOMRect(rect.left, rect.top, 1, rect.height || 20)
      }
      
      // Open menu with empty query
      if (anchorRect) {
        setSlashMenuState({ blockId, anchorRect, query: "", activeIndex: 0 })
      }
    },
    []
  )

  // Shared function to open slash menu for a block (legacy, uses getCaretRectFromSelection)
  const openSlashMenuForBlock = useCallback(
    (blockId: string, retryCount = 0) => {
      const textarea = blockRefs.current.get(blockId)
      if (!textarea) {
        // If textarea not available yet and we haven't retried, try once more
        if (retryCount === 0) {
          requestAnimationFrame(() => {
            openSlashMenuForBlock(blockId, 1)
          })
        }
        return
      }
      
      // First try: use getCaretRectFromSelection (preferred - uses caret position)
      let anchorRect = getCaretRectFromSelection(textarea)
      
      // If caret rect is empty/0 (common right after insert), retry once with requestAnimationFrame
      if (!anchorRect || anchorRect.width === 0 || anchorRect.height === 0) {
        if (retryCount === 0) {
          requestAnimationFrame(() => {
            openSlashMenuForBlock(blockId, 1)
          })
          return
        }
        
        // After retry, if still no caret rect, use fallback
        // Fallback: use textarea's bounding rect, aligned to text column start
        const rect = textarea.getBoundingClientRect()
        // Use the textarea's left edge (which is already in the text column, not gutter)
        // Position at the top-left of the textarea where text starts
        anchorRect = new DOMRect(rect.left, rect.top, 1, rect.height || 20)
      }
      
      setSlashMenuState({ blockId, anchorRect, query: "", activeIndex: 0 })
    },
    []
  )

  // Handle slash command (called from RichTextBlock when "/" is typed)
  const handleSlashCommand = useCallback(
    (blockId: string, anchorRect: DOMRect, query: string) => {
      setSlashMenuState({ blockId, anchorRect, query, activeIndex: 0 })
    },
    []
  )

  // Handle mark toggle
  const handleToggleMark = useCallback(
    (type: MarkType, blockId: string, selectionStart: number, selectionEnd: number) => {
      const block = doc.blocks.find((b) => b.id === blockId)
      if (!block) {
        return
      }
      
      // Get textarea ref
      const textarea = blockRefs.current.get(blockId)
      if (!textarea) {
        return
      }
      
      // Capture current selection from textarea as fallback (in case props are stale)
      const currentSelectionStart = textarea.selectionStart
      const currentSelectionEnd = textarea.selectionEnd
      const finalStart = selectionStart !== selectionEnd ? selectionStart : currentSelectionStart
      const finalEnd = selectionStart !== selectionEnd ? selectionEnd : currentSelectionEnd
      
      if (finalStart === finalEnd) {
        return
      }
      
      // Toggle the mark
      const updatedBlock = toggleMark(
        block,
        type,
        finalStart,
        finalEnd
      )
      
      // Update document immediately - this triggers React re-render with new marks
      const updatedDoc = {
        ...doc,
        blocks: doc.blocks.map((b) => (b.id === block.id ? updatedBlock : b)),
      }
      onChange(updatedDoc)
      
      // Preserve selection after toggle
      // Use double requestAnimationFrame to ensure React has re-rendered the mirror overlay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (textarea && textarea.isConnected) {
            textarea.focus()
            textarea.setSelectionRange(finalStart, finalEnd)
            // Update toolbar state to reflect new marks
            handleSelectionChange(blockId, textarea)
          }
        })
      })
    },
    [doc, onChange, handleSelectionChange]
  )

  // Get active marks for the current selection
  const getActiveMarks = useCallback((): Set<MarkType> => {
    if (!toolbarState.activeBlockId) return new Set()
    
    const block = doc.blocks.find((b) => b.id === toolbarState.activeBlockId)
    if (!block || !block.marks?.ranges) return new Set()
    
    const activeMarks = new Set<MarkType>()
    const { selectionStart, selectionEnd } = toolbarState
    
    for (const range of block.marks.ranges) {
      // Check if the selection is fully covered by this mark
      if (range.start <= selectionStart && range.end >= selectionEnd) {
        activeMarks.add(range.type)
      }
    }
    
    return activeMarks
  }, [toolbarState, doc])

  // Handle keyboard events for blocks
  const handleBlockKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement>,
      blockId: string,
      textarea: HTMLTextAreaElement
    ) => {
      const cursorPosition = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      const textLength = textarea.value.length
      const isAtStart = cursorPosition === 0
      const isAtEnd = cursorPosition === textLength
      const isEmpty = textLength === 0
      
      // Check if there's a non-collapsed selection (text is selected)
      const hasSelection = cursorPosition !== selectionEnd

      // For Backspace/Delete with selection, let native behavior handle it
      // This allows normal text deletion when text is selected
      if ((e.key === "Backspace" || e.key === "Delete") && hasSelection) {
        // Don't preventDefault - let browser delete the selection naturally
        // The onChange handler will sync state after the deletion
        return
      }

      // Handle slash menu keyboard navigation if menu is open
      if (slashMenuState && slashMenuState.blockId === blockId) {
        // Get filtered commands
        const currentQuery = slashMenuState.query
        const filtered = SLASH_COMMANDS.filter((cmd) => {
          if (!currentQuery.trim()) return true
          const searchLower = currentQuery.toLowerCase()
          return (
            cmd.label.toLowerCase().includes(searchLower) ||
            (cmd.keywords && cmd.keywords.some((kw) => kw.toLowerCase().includes(searchLower)))
          )
        })
        
        // Handle Backspace: update query, close menu if query becomes empty
        if (e.key === "Backspace") {
          const text = textarea.value
          const textBeforeCursor = text.slice(0, cursorPosition)
          const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/)
          const isPlusButtonBlock = plusButtonBlocksRef.current.has(blockId)
          
          if (slashMatch) {
            const queryAfterSlash = slashMatch[1].slice(1) // Remove the "/"
            // If backspace would make query empty, close menu
            if (queryAfterSlash.length <= 1) {
              e.preventDefault()
              plusButtonBlocksRef.current.delete(blockId)
              setSlashMenuState(null)
              // Remove "/" from text
              const newText = text.replace(slashMatch[1], "").trim()
              handleBlockChange(blockId, newText)
              return
            }
            // Otherwise, let normal backspace happen (handleBlockChange will update query)
          } else if (isPlusButtonBlock) {
            // For + button blocks, if text becomes empty, close menu
            if (text.trim().length <= 1) {
              e.preventDefault()
              plusButtonBlocksRef.current.delete(blockId)
              setSlashMenuState(null)
              // Clear text
              handleBlockChange(blockId, "")
              return
            }
            // Otherwise, let normal backspace happen (handleBlockChange will update query)
          } else {
            // No slash match and not a + button block, close menu
            e.preventDefault()
            setSlashMenuState(null)
            return
          }
        }
        
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSlashMenuState((prev) => {
            if (!prev) return prev
            const newIndex = prev.activeIndex < filtered.length - 1 ? prev.activeIndex + 1 : 0
            return { ...prev, activeIndex: newIndex }
          })
          return
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          setSlashMenuState((prev) => {
            if (!prev) return prev
            const newIndex = prev.activeIndex > 0 ? prev.activeIndex - 1 : filtered.length - 1
            return { ...prev, activeIndex: newIndex }
          })
          return
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          // Select highlighted command and close menu
          if (filtered.length > 0) {
            const commandType = filtered[slashMenuState.activeIndex]?.type || filtered[0].type
            
            // Get current text and cursor position before conversion
            const text = textarea.value
            const textBeforeCursor = text.slice(0, cursorPosition)
            const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/)
            const isPlusButtonBlock = plusButtonBlocksRef.current.has(blockId)
            
            // Calculate new text - always clear filter text when selecting from menu
            // The placeholder will show the appropriate text for the block type
            let newText = ""
            
            if (slashMatch) {
              // For traditional "/" commands, remove the "/query" pattern
              newText = text.replace(slashMatch[1], "").trim()
            }
            // For + button blocks, newText is already "" (clear filter text)
            
            // Convert block type
            const updatedDoc = convertBlockType(doc, blockId, commandType)
            
            // For divider blocks, ensure text is empty
            if (commandType === "divider") {
              newText = ""
            }
            
            // Always clear text when selecting from menu - placeholder will show instead
            // This ensures the filter text doesn't remain after selection
            const finalDoc = updateBlockText(updatedDoc, blockId, newText)
            onChange(finalDoc)
            // Clean up + button tracking when command is selected
            plusButtonBlocksRef.current.delete(blockId)
            setSlashMenuState(null)
            
            // Focus the block and position cursor at end of remaining text
            setTimeout(() => {
              const updatedTextarea = blockRefs.current.get(blockId)
              if (updatedTextarea) {
                updatedTextarea.focus()
                const endPos = newText.length
                updatedTextarea.setSelectionRange(endPos, endPos)
              }
            }, 0)
          }
          return
        } else if (e.key === "Escape") {
          e.preventDefault()
          const isPlusButtonBlock = plusButtonBlocksRef.current.has(blockId)
          
          if (isPlusButtonBlock) {
            // For + button blocks, clear text and close menu
            plusButtonBlocksRef.current.delete(blockId)
            handleBlockChange(blockId, "")
          } else {
            // Close menu and clear query (remove "/" from text)
            const text = textarea.value
            const textBeforeCursor = text.slice(0, cursorPosition)
            const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/)
            if (slashMatch) {
              const newText = text.replace(slashMatch[1], "").trim()
              handleBlockChange(blockId, newText)
            }
          }
          setSlashMenuState(null)
          return
        }
      }

      // Keyboard shortcuts: Cmd/Ctrl+B/I/U for formatting
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const selectionStart = textarea.selectionStart
        const selectionEnd = textarea.selectionEnd
        
        if (selectionStart !== selectionEnd) {
          if (e.key === "b" || e.key === "B") {
            e.preventDefault()
            handleToggleMark("bold", blockId, selectionStart, selectionEnd)
            return
          } else if (e.key === "i" || e.key === "I") {
            e.preventDefault()
            handleToggleMark("italic", blockId, selectionStart, selectionEnd)
            return
          } else if (e.key === "u" || e.key === "U") {
            e.preventDefault()
            handleToggleMark("underline", blockId, selectionStart, selectionEnd)
            return
          }
        }
      }

      // Enter: Split block at cursor
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        const result = splitBlockAtCursor(doc, blockId, cursorPosition)
        onChange(result.doc)
        // Focus the new block at the start
        setTimeout(() => {
          focusBlock(result.newBlockId, 0)
        }, 0)
        return
      }

      // Backspace at start of non-empty block: Merge with previous
      if (e.key === "Backspace" && isAtStart && !isEmpty) {
        e.preventDefault()
        const result = mergeWithPrev(doc, blockId)
        if (result.previousBlockId) {
          onChange(result.doc)
          // Focus previous block at merge point
          setTimeout(() => {
            focusBlock(result.previousBlockId!, result.mergePosition)
          }, 0)
        }
        return
      }

      // Backspace on empty block: Delete it
      if (e.key === "Backspace" && isEmpty) {
        e.preventDefault()
        const previousBlockId = getPreviousBlockId(doc, blockId)
        const updatedDoc = deleteBlock(doc, blockId)
        onChange(updatedDoc)
        // Focus previous block if it exists
        if (previousBlockId) {
          setTimeout(() => {
            focusBlock(previousBlockId)
          }, 0)
        }
        return
      }

      // ArrowUp at start: Move to previous block
      if (e.key === "ArrowUp" && isAtStart) {
        e.preventDefault()
        const previousBlockId = getPreviousBlockId(doc, blockId)
        if (previousBlockId) {
          focusBlock(previousBlockId)
        }
        return
      }

      // ArrowDown at end: Move to next block
      if (e.key === "ArrowDown" && isAtEnd) {
        e.preventDefault()
        const nextBlockId = getNextBlockId(doc, blockId)
        if (nextBlockId) {
          focusBlock(nextBlockId)
        }
        return
      }
    },
    [doc, onChange, focusBlock, slashMenuState, handleBlockChange, handleToggleMark]
  )

  // Handle click on empty space below blocks
  const handleBlocksContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks on the container itself, not on blocks
    if (e.target === blocksContainerRef.current) {
      const lastBlock = doc.blocks[doc.blocks.length - 1]
      if (lastBlock) {
        focusBlock(lastBlock.id)
      }
    }
  }

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto"
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [doc.title])

  // Ref to the slash menu container for outside-click detection
  const slashMenuRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close slash menu
  useEffect(() => {
    if (!slashMenuState) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      
      // Don't close if clicking on the menu itself
      if (slashMenuRef.current && slashMenuRef.current.contains(target)) {
        return
      }
      
      // Don't close if clicking on the textarea that has the menu
      const textarea = blockRefs.current.get(slashMenuState.blockId)
      if (textarea && (target === textarea || textarea.contains(target))) {
        return
      }
      
      // Close menu on outside click
      setSlashMenuState(null)
    }

    // Use capture phase so it triggers before editor selection changes
    document.addEventListener("pointerdown", handlePointerDown, true)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [slashMenuState])

  // Update menu position on scroll (both window and textarea scroll)
  useEffect(() => {
    if (!slashMenuState) return

    const textarea = blockRefs.current.get(slashMenuState.blockId)
    if (!textarea) return

    const handleScroll = () => {
      // Recalculate anchorRect from current caret position
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = textarea.value.slice(0, cursorPos)
      const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/)([^\s]*)$/)
      
      if (slashMatch) {
        const query = slashMatch[2] || ""
        const anchorRect = getCaretRectFromSelection(textarea)
        if (anchorRect) {
          setSlashMenuState((prev) => {
            if (!prev) return null
            return { ...prev, anchorRect, query }
          })
        }
      }
    }

    // Listen to both window scroll and textarea scroll
    window.addEventListener("scroll", handleScroll, true)
    textarea.addEventListener("scroll", handleScroll)
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      textarea.removeEventListener("scroll", handleScroll)
    }
  }, [slashMenuState])

  // Global click listener to clear active gutter when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      // Don't clear if clicking on gutter controls or gutter area
      if (
        target.closest('[data-gutter-controls]') ||
        target.closest('[data-gutter-area]')
      ) {
        return
      }
      // Clear active gutter
      setActiveGutterBlockId(null)
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [])

  // Handle gutter click - activate gutter for a block
  const handleGutterClick = useCallback((blockId: string) => {
    setActiveGutterBlockId(blockId)
  }, [])

  // Track typing state - called from BlockRow when user types
  const handleBlockTyping = useCallback((blockId: string, isTyping: boolean) => {
    if (isTyping) {
      typingBlocksRef.current.add(blockId)
    } else {
      typingBlocksRef.current.delete(blockId)
    }
  }, [])

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-[708px] pt-[132px] overflow-visible">
        {/* Title */}
        <div className="mt-5 mb-3">
          <textarea
            ref={titleRef}
            value={doc.title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled"
            className="w-full bg-transparent border-none outline-none resize-none text-[40px] font-bold text-gray-900 leading-[1.1] tracking-[-0.02em] placeholder:text-gray-400 focus:outline-none"
            rows={1}
            style={{
              fontFamily: "inherit",
              minHeight: "48px",
            }}
          />
        </div>

        {/* Blocks */}
        <div
          ref={blocksContainerRef}
          className="space-y-2 min-h-[200px]"
          onClick={handleBlocksContainerClick}
        >
        {doc.blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] text-gray-400 mb-2">Click anywhere to start typing</p>
            <p className="text-[14px] text-gray-400">Or type &quot;/&quot; to see commands</p>
          </div>
        ) : (
          doc.blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              blockIndex={index}
              allBlocks={doc.blocks}
              onChange={(text) => handleBlockChange(block.id, text)}
              onKeyDown={(e, textarea) => handleBlockKeyDown(e, block.id, textarea)}
              onRegisterRef={(ref) => registerBlockRef(block.id, ref)}
              onSelectionChange={(textarea) => handleSelectionChange(block.id, textarea)}
              onSlashCommand={handleSlashCommand}
              isSlashMenuOpen={slashMenuState?.blockId === block.id}
              isPlusButtonBlock={plusButtonBlocksRef.current.has(block.id)}
              isGutterActive={activeGutterBlockId === block.id}
              onGutterClick={handleGutterClick}
              onTypingChange={handleBlockTyping}
              onToggleTodo={(blockId) => {
                const block = doc.blocks.find((b) => b.id === blockId)
                if (!block || block.type !== "todo") return
                
                const updatedDoc = {
                  ...doc,
                  blocks: doc.blocks.map((b) =>
                    b.id === blockId
                      ? { ...b, checked: !b.checked }
                      : b
                  ),
                }
                onChange(updatedDoc)
              }}
              onInsertBlock={(afterBlockId) => {
                // Find the block index
                const blockIndex = doc.blocks.findIndex((b) => b.id === afterBlockId)
                if (blockIndex === -1) return
                
                // Get the current block to determine the new block type
                const currentBlock = doc.blocks[blockIndex]
                
                // Determine new block type: if current is a list item, create same type; otherwise paragraph
                let newBlockType: BlockType = "paragraph"
                if (currentBlock.type === "bulleted" || currentBlock.type === "numbered") {
                  newBlockType = currentBlock.type
                }
                
                // Create new block with appropriate type
                const newBlock = createBlock(newBlockType, "")
                const newId = newBlock.id
                
                // Insert after current block
                const newBlocks = [...doc.blocks]
                newBlocks.splice(blockIndex + 1, 0, newBlock)
                
                const updatedDoc = { ...doc, blocks: newBlocks }
                onChange(updatedDoc)
                
                // Open menu ONLY after the new block's caret selection rect exists
                // Use double requestAnimationFrame + small timeout to ensure DOM is fully updated and textarea is rendered
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    // Small additional delay to ensure textarea is fully rendered and styles are applied
                    setTimeout(() => {
                      // Get caret rect with retries - this ensures the caret is positioned before opening menu
                      getCaretRectWithRetries(newId).then((anchorRect) => {
                        // Mark this block as created via + button
                        plusButtonBlocksRef.current.add(newId)
                        // Open menu using the caret rect
                        setSlashMenuState({
                          blockId: newId,
                          anchorRect,
                          query: "",
                          activeIndex: 0,
                        })
                      })
                    }, 10)
                  })
                })
              }}
              onMoveBlock={(fromIndex, toIndex) => {
                const updatedDoc = moveBlock(doc, fromIndex, toIndex)
                onChange(updatedDoc)
              }}
            />
          ))
        )}
      </div>
      
      {/* Selection Toolbar */}
      {toolbarState.position && toolbarState.activeBlockId && (
        <SelectionToolbar
          position={toolbarState.position}
          onToggleMark={handleToggleMark}
          activeMarks={getActiveMarks()}
          blockId={toolbarState.activeBlockId}
          selectionStart={toolbarState.selectionStart}
          selectionEnd={toolbarState.selectionEnd}
        />
      )}

      {/* Slash Menu */}
      {slashMenuState && (
        <SlashMenu
          ref={slashMenuRef}
          anchorRect={slashMenuState.anchorRect}
          blockId={slashMenuState.blockId}
          items={SLASH_COMMANDS}
          query={slashMenuState.query}
          activeIndex={slashMenuState.activeIndex}
          open={slashMenuState !== null}
          onSelect={(commandType) => {
            const blockId = slashMenuState.blockId
            const textarea = blockRefs.current.get(blockId)
            
            if (!textarea) {
              plusButtonBlocksRef.current.delete(blockId)
              setSlashMenuState(null)
              return
            }
            
            // Get current text and cursor position before conversion
            const text = textarea.value
            const cursorPos = textarea.selectionStart
            const textBeforeCursor = text.slice(0, cursorPos)
            const slashMatch = textBeforeCursor.match(/(?:^|\s)(\/[^\s]*)$/)
            const isPlusButtonBlock = plusButtonBlocksRef.current.has(blockId)
            
            // Calculate new text - always clear filter text when selecting from menu
            // The placeholder will show the appropriate text for the block type
            let newText = ""
            
            if (slashMatch) {
              // For traditional "/" commands, remove the "/query" pattern
              newText = text.replace(slashMatch[1], "").trim()
            }
            // For + button blocks, newText is already "" (clear filter text)
            
            // Convert block type
            const updatedDoc = convertBlockType(doc, blockId, commandType)
            
            // For divider blocks, ensure text is empty
            if (commandType === "divider") {
              newText = ""
            }
            
            // Always clear text when selecting from menu - placeholder will show instead
            // This ensures the filter text doesn't remain after selection
            const finalDoc = updateBlockText(updatedDoc, blockId, newText)
            onChange(finalDoc)
            // Clean up + button tracking when command is selected
            plusButtonBlocksRef.current.delete(blockId)
            setSlashMenuState(null)
            
            // Focus the block and position cursor at end of remaining text
            setTimeout(() => {
              const updatedTextarea = blockRefs.current.get(blockId)
              if (updatedTextarea) {
                updatedTextarea.focus()
                const endPos = newText.length
                updatedTextarea.setSelectionRange(endPos, endPos)
              }
            }, 0)
          }}
          onClose={() => {
            // Clean up + button tracking when menu closes
            if (slashMenuState) {
              plusButtonBlocksRef.current.delete(slashMenuState.blockId)
            }
            setSlashMenuState(null)
            // Restore focus to textarea
            if (slashMenuState) {
              const textarea = blockRefs.current.get(slashMenuState.blockId)
              if (textarea) {
                setTimeout(() => textarea.focus(), 0)
              }
            }
          }}
        />
      )}
      </div>
    </div>
  )
}
