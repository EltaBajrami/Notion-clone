"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Block } from "@/lib/types"
import { RichTextBlock } from "./RichTextBlock"
import { Plus, GripVertical } from "lucide-react"

interface BlockRowProps {
  block: Block
  blockIndex: number
  allBlocks?: Block[]
  isFocused?: boolean
  onChange: (text: string, prevText?: string, selectionStart?: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, textarea: HTMLTextAreaElement) => void
  onRegisterRef: (ref: HTMLTextAreaElement | null) => void
  onSelectionChange?: (textarea: HTMLTextAreaElement) => void
  onInsertBlock?: (afterBlockId: string) => void
  onMoveBlock?: (fromIndex: number, toIndex: number) => void
  onSlashCommand?: (blockId: string, anchorRect: DOMRect, query: string) => void
  onToggleTodo?: (blockId: string) => void
  isSlashMenuOpen?: boolean
  isPlusButtonBlock?: boolean
  isGutterActive?: boolean
  onGutterClick?: (blockId: string) => void
  onTypingChange?: (blockId: string, isTyping: boolean) => void
}

export function BlockRow({
  block,
  blockIndex,
  allBlocks = [],
  isFocused = false,
  onChange,
  onKeyDown,
  onRegisterRef,
  onSelectionChange,
  onInsertBlock,
  onMoveBlock,
  onSlashCommand,
  onToggleTodo,
  isSlashMenuOpen = false,
  isPlusButtonBlock = false,
  isGutterActive = false,
  onGutterClick,
  onTypingChange,
}: BlockRowProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isGutterHovered, setIsGutterHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const registeredRef = useRef<HTMLTextAreaElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isHeading = block.type === "heading1" || block.type === "heading2" || block.type === "heading3"
  const isEmpty = block.text.trim() === ""
  
  // Get heading level for placeholder
  const getHeadingPlaceholder = () => {
    if (block.type === "heading1") return "Heading 1"
    if (block.type === "heading2") return "Heading 2"
    if (block.type === "heading3") return "Heading 3"
    return "Heading 1"
  }

  const handleStartEdit = (clickPosition: number) => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    setIsTyping(false)
    if (onTypingChange) {
      onTypingChange(block.id, false)
    }
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  // Handle keydown to track typing state
  const handleKeyDownWithTyping = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mark as typing
    setIsTyping(true)
    if (onTypingChange) {
      onTypingChange(block.id, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to mark as not typing after 400ms of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (onTypingChange) {
        onTypingChange(block.id, false)
      }
    }, 400)

    // Call original onKeyDown handler
    if (textareaRef.current) {
      onKeyDown(e, textareaRef.current)
    }
  }

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Handle gutter click
  const handleGutterClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onGutterClick) {
      onGutterClick(block.id)
    }
  }

  // Track when ref is registered - if it's focused, enter edit mode
  const handleRegisterRef = useCallback((ref: HTMLTextAreaElement | null) => {
    // Only process if ref actually changed to avoid infinite loops
    if (registeredRef.current === ref) {
      return
    }
    registeredRef.current = ref
    textareaRef.current = ref // Store ref for + button handler
    onRegisterRef(ref)
    // If textarea is focused when registered, enter edit mode
    // Check isEditing via functional update to avoid dependency
    if (ref && document.activeElement === ref) {
      setIsEditing((prev) => {
        // Only set if not already editing to avoid unnecessary updates
        return prev ? prev : true
      })
    }
  }, [onRegisterRef])

  // Auto-enter edit mode when block is focused via keyboard
  useEffect(() => {
    if (isFocused) {
      setIsEditing(true)
    }
  }, [isFocused])

  // Handle insert block - just focus the block (don't open slash menu)
  const handleInsertBlock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Insert a new block after this one
    if (onInsertBlock) {
      onInsertBlock(block.id)
    }
  }, [block.id, onInsertBlock])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", blockIndex.toString())
      // Add visual feedback
      if (dragHandleRef.current) {
        dragHandleRef.current.style.opacity = "0.5"
      }
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setIsDragging(false)
    setIsDragOver(false)
    // Restore visual feedback
    if (dragHandleRef.current) {
      dragHandleRef.current.style.opacity = "1"
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move"
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    const toIndex = blockIndex
    
    if (!isNaN(fromIndex) && fromIndex !== toIndex && onMoveBlock) {
      onMoveBlock(fromIndex, toIndex)
    }
  }

  // Divider blocks render a horizontal line
  if (block.type === "divider") {
    return (
      <div
        data-block-id={block.id}
        className="w-full"
        style={{ marginTop: "1px", marginBottom: "1px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            width: "100%",
            height: "13px",
            flex: "0 0 auto",
          }}
        >
          <div
            role="separator"
            style={{
              width: "100%",
              height: "1px",
              visibility: "visible",
              backgroundColor: "rgba(55, 53, 47, 0.16)",
            }}
          />
        </div>
      </div>
    )
  }

  // Callout, bookmark, and page blocks are rendered directly without editing controls
  if (block.type === "callout" || block.type === "bookmark" || block.type === "page") {
    return (
      <div
        data-block-id={block.id}
        className="w-full"
        style={{ marginTop: "4px", marginBottom: "4px" }}
      >
        <RichTextBlock
          block={block}
          blockIndex={blockIndex}
          allBlocks={allBlocks}
          isEditing={false}
          onStartEdit={() => {}}
          onTextChange={() => {}}
          onKeyDown={() => {}}
          onRegisterRef={() => {}}
          onBlur={() => {}}
          placeholder=""
        />
      </div>
    )
  }

  return (
    <div
      data-block-id={block.id}
      className={`group relative flex w-full ${
        isDragging ? "opacity-50" : ""
      } ${isDragOver ? "bg-blue-50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Prevent container click handler from firing when clicking on block
        e.stopPropagation()
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      draggable={false}
    >
      {/* Left gutter controls - absolutely positioned to the left in a fixed-width gutter */}
      <div
        data-gutter-controls
        className={`
          absolute
          left-[-56px]
          top-[1px]
          w-[44px]
          flex
          items-center
          gap-2
          transition-opacity
          duration-150
          pointer-events-auto
          ${
            isGutterHovered || 
            (isHovered && !isTyping) || 
            (isEditing && !isTyping) || 
            (isGutterActive && !isTyping)
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }
        `}
        onMouseEnter={() => setIsGutterHovered(true)}
        onMouseLeave={() => setIsGutterHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          handleGutterClick(e as any)
        }}
      >
        {/* Plus button - inserts block below current block */}
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={handleInsertBlock}
          title="Add block"
          className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </button>
        {/* Drag handle - six-dot grip for reordering */}
        <div
          ref={dragHandleRef}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title="Drag to reorder"
          className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-grab active:cursor-grabbing transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
        >
          <GripVertical className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">
        <RichTextBlock
          block={block}
          blockIndex={blockIndex}
          allBlocks={allBlocks}
          isEditing={isEditing}
          onStartEdit={handleStartEdit}
          onTextChange={onChange}
          onKeyDown={handleKeyDownWithTyping}
          onRegisterRef={handleRegisterRef}
          onBlur={handleBlur}
          onSelectionChange={onSelectionChange}
          onSlashCommand={onSlashCommand}
          onToggleTodo={onToggleTodo}
          placeholder={
            isHeading 
              ? getHeadingPlaceholder() 
              : (isPlusButtonBlock && isSlashMenuOpen 
                  ? "Type to filter..." 
                  : "Press '/' for commands")
          }
          isSlashMenuOpen={isSlashMenuOpen}
          isPlusButtonBlock={isPlusButtonBlock}
          className={
            block.type === "heading1"
              ? "w-full bg-transparent outline-none resize-none text-[24px] font-semibold text-gray-900 leading-[1.3] placeholder:text-gray-400 focus:outline-none overflow-hidden py-0"
              : block.type === "heading2"
              ? "w-full bg-transparent outline-none resize-none text-[20px] font-semibold text-gray-900 leading-[1.4] placeholder:text-gray-400 focus:outline-none overflow-hidden py-0"
              : block.type === "heading3"
              ? "w-full bg-transparent outline-none resize-none text-[18px] font-semibold text-gray-900 leading-[1.4] placeholder:text-gray-400 focus:outline-none overflow-hidden py-0"
              : "w-full bg-transparent outline-none resize-none text-[16px] text-gray-700 leading-[28px] placeholder:text-gray-400 focus:outline-none overflow-hidden py-0"
          }
          minHeight={
            block.type === "heading1" ? 32 :
            block.type === "heading2" ? 28 :
            block.type === "heading3" ? 26 :
            28
          }
        />
      </div>
    </div>
  )
}
