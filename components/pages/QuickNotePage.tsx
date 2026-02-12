"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, GripVertical } from "lucide-react"

// Storage key for Quick Note content
const QUICK_NOTE_STORAGE_KEY = "quick_note_page"

// Block types for Quick Note
type QuickNoteBlockType = "callout" | "heading" | "divider" | "paragraph" | "todo"

interface QuickNoteBlock {
  id: string
  type: QuickNoteBlockType
  content: string
  checked?: boolean // for todo blocks
  icon?: string // for callout blocks
}

interface QuickNoteState {
  title: string
  blocks: QuickNoteBlock[]
}

const defaultState: QuickNoteState = {
  title: "Quick Note",
  blocks: [
    {
      id: "callout-1",
      type: "callout",
      icon: "💡",
      content: "Notion Tip: Use this template to write quick notes you can reference later and quickly create a rich document. You can embed links, images, to-do's, and more. Learn more about the different types of content blocks here.",
    },
    { id: "heading-1", type: "heading", content: "Jot down some text" },
    { id: "divider-1", type: "divider", content: "" },
    {
      id: "paragraph-1",
      type: "paragraph",
      content: "They found Mary, as usual, deep in the study of thorough-bass and human nature; and had some extracts to admire, and some new observations of threadbare morality to listen to. Catherine and Lydia had information for them of a different sort.",
    },
    { id: "heading-2", type: "heading", content: "Make a to-do list" },
    { id: "divider-2", type: "divider", content: "" },
    { id: "todo-1", type: "todo", content: "Wake up", checked: true },
    { id: "todo-2", type: "todo", content: "Brush teeth", checked: true },
    { id: "todo-3", type: "todo", content: "Eat breakfast", checked: false },
  ],
}

function loadQuickNoteState(): QuickNoteState {
  if (typeof window === "undefined") {
    return defaultState
  }

  try {
    const raw = window.localStorage.getItem(QUICK_NOTE_STORAGE_KEY)
    if (!raw) {
      return defaultState
    }
    const parsed = JSON.parse(raw)
    if (typeof parsed.title === "string" && Array.isArray(parsed.blocks)) {
      return parsed
    }
    return defaultState
  } catch {
    return defaultState
  }
}

function saveQuickNoteState(state: QuickNoteState): void {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(QUICK_NOTE_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Error saving Quick Note state:", error)
  }
}

// Font family constant
const FONT_FAMILY = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'

export function QuickNotePage() {
  const [state, setState] = useState<QuickNoteState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadQuickNoteState()
    setState(loaded)
    setIsLoaded(true)
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveQuickNoteState(state)
    }
  }, [state, isLoaded])

  // Handle title change
  const handleTitleChange = useCallback(() => {
    if (titleRef.current) {
      const newTitle = titleRef.current.textContent || ""
      setState((prev) => ({ ...prev, title: newTitle }))
    }
  }, [])

  // Update block content
  const updateBlockContent = useCallback((blockId: string, content: string) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block
      ),
    }))
  }, [])

  // Toggle todo checkbox
  const toggleTodo = useCallback((blockId: string) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId && block.type === "todo"
          ? { ...block, checked: !block.checked }
          : block
      ),
    }))
  }, [])

  // Insert a new block after a specific block
  const insertBlockAfter = useCallback((afterBlockId: string, type: QuickNoteBlockType = "paragraph") => {
    const newId = `block-${Date.now()}`
    setState((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === afterBlockId)
      const newBlocks = [...prev.blocks]
      const newBlock: QuickNoteBlock = {
        id: newId,
        type,
        content: "",
        ...(type === "todo" ? { checked: false } : {}),
      }
      newBlocks.splice(index + 1, 0, newBlock)
      return { ...prev, blocks: newBlocks }
    })
    // Focus the new block after render
    setTimeout(() => {
      const newBlockEl = blockRefs.current.get(newId)
      if (newBlockEl) {
        newBlockEl.focus()
      }
    }, 0)
    return newId
  }, [])

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setState((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === blockId)
      if (prev.blocks.length <= 1) {
        // Don't delete the last block, just clear it
        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === blockId ? { ...b, content: "" } : b
          ),
        }
      }
      const newBlocks = prev.blocks.filter((b) => b.id !== blockId)
      // Focus previous block
      const prevBlock = prev.blocks[index - 1]
      if (prevBlock) {
        setTimeout(() => {
          const prevEl = blockRefs.current.get(prevBlock.id)
          if (prevEl) {
            prevEl.focus()
            // Move cursor to end
            const range = document.createRange()
            const sel = window.getSelection()
            range.selectNodeContents(prevEl)
            range.collapse(false)
            sel?.removeAllRanges()
            sel?.addRange(range)
          }
        }, 0)
      }
      return { ...prev, blocks: newBlocks }
    })
  }, [])

  // Move block (drag and drop)
  const moveBlock = useCallback((fromId: string, toId: string) => {
    setState((prev) => {
      const fromIndex = prev.blocks.findIndex((b) => b.id === fromId)
      const toIndex = prev.blocks.findIndex((b) => b.id === toId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev
      }
      const newBlocks = [...prev.blocks]
      const [movedBlock] = newBlocks.splice(fromIndex, 1)
      newBlocks.splice(toIndex, 0, movedBlock)
      return { ...prev, blocks: newBlocks }
    })
  }, [])

  // Sync DOM content back to state after native deletion
  const syncBlocksFromDOM = useCallback(() => {
    setState((prev) => {
      const newBlocks = prev.blocks.map((block) => {
        const el = blockRefs.current.get(block.id)
        if (el) {
          const newContent = el.textContent || ""
          if (newContent !== block.content) {
            return { ...block, content: newContent }
          }
        }
        return block
      })
      // Filter out empty blocks (except keep at least one)
      const nonEmptyBlocks = newBlocks.filter((b) => b.content.trim() !== "" || b.type === "divider" || b.type === "callout")
      if (nonEmptyBlocks.length === 0 && newBlocks.length > 0) {
        return { ...prev, blocks: [newBlocks[0]] }
      }
      return { ...prev, blocks: nonEmptyBlocks.length > 0 ? nonEmptyBlocks : newBlocks }
    })
  }, [])

  // Handle keydown for blocks
  const handleBlockKeyDown = useCallback(
    (e: React.KeyboardEvent, blockId: string, content: string, blockType: QuickNoteBlockType) => {
      // Check if there's a non-collapsed selection
      const selection = window.getSelection()
      const hasSelection = selection && !selection.isCollapsed

      // For Backspace/Delete with selection, let native behavior handle it
      if ((e.key === "Backspace" || e.key === "Delete") && hasSelection) {
        // Don't preventDefault - let browser delete the selection
        // After native deletion, sync state
        queueMicrotask(() => {
          syncBlocksFromDOM()
        })
        return
      }

      // Custom logic only runs when selection is collapsed
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        // For todos, insert another todo; for others, insert paragraph
        const newType = blockType === "todo" ? "todo" : "paragraph"
        insertBlockAfter(blockId, newType)
      } else if (e.key === "Backspace" && content === "") {
        e.preventDefault()
        deleteBlock(blockId)
      }
    },
    [insertBlockAfter, deleteBlock, syncBlocksFromDOM]
  )

  // Register block ref
  const registerBlockRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      blockRefs.current.set(id, el)
    } else {
      blockRefs.current.delete(id)
    }
  }, [])

  // Drag handlers
  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedBlockId && dragOverBlockId && draggedBlockId !== dragOverBlockId) {
      moveBlock(draggedBlockId, dragOverBlockId)
    }
    setDraggedBlockId(null)
    setDragOverBlockId(null)
  }, [draggedBlockId, dragOverBlockId, moveBlock])

  const handleDragOver = useCallback((blockId: string) => {
    setDragOverBlockId(blockId)
  }, [])

  if (!isLoaded) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_FAMILY,
        }}
      >
        <div style={{ color: "#9b9a97" }}>Loading...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden auto",
        backgroundColor: "white",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Page content container */}
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          marginInline: "auto",
          paddingInline: "96px",
          paddingTop: "80px",
          paddingBottom: "30vh",
        }}
      >
        {/* Page icon - floating above title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "78px",
            width: "78px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "78px", lineHeight: 1 }}>📌</span>
        </div>

        {/* Page title - editable */}
        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleChange}
          spellCheck={false}
          style={{
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#37352f",
            marginBottom: "16px",
            outline: "none",
            cursor: "text",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {state.title}
        </h1>

        {/* Blocks */}
        <div style={{ position: "relative" }}>
          {state.blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              blockIndex={index}
              onContentChange={(content) => updateBlockContent(block.id, content)}
              onToggleTodo={() => toggleTodo(block.id)}
              onKeyDown={(e, content) => handleBlockKeyDown(e, block.id, content, block.type)}
              onInsertBlock={() => {
                // Always insert a paragraph block (matching DocumentEditor behavior)
                insertBlockAfter(block.id, "paragraph")
              }}
              onDragStart={() => handleDragStart(block.id)}
              onDragEnd={handleDragEnd}
              onDragOver={() => handleDragOver(block.id)}
              isDragging={draggedBlockId === block.id}
              isDragOver={dragOverBlockId === block.id && draggedBlockId !== block.id}
              registerRef={(el) => registerBlockRef(block.id, el)}
            />
          ))}
        </div>

        {/* Add block button at the end */}
        <button
          onClick={() => {
            const lastBlock = state.blocks[state.blocks.length - 1]
            if (lastBlock) {
              insertBlockAfter(lastBlock.id, "paragraph")
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
            padding: "4px 8px",
            marginLeft: "-8px",
            fontSize: "14px",
            color: "rgba(55, 53, 47, 0.5)",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 100ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(55, 53, 47, 0.08)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <Plus style={{ width: "14px", height: "14px" }} />
          <span>New block</span>
        </button>
      </div>
    </div>
  )
}

// BlockRow component
interface BlockRowProps {
  block: QuickNoteBlock
  blockIndex: number
  onContentChange: (content: string) => void
  onToggleTodo: () => void
  onKeyDown: (e: React.KeyboardEvent, content: string) => void
  onInsertBlock: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: () => void
  isDragging: boolean
  isDragOver: boolean
  registerRef: (el: HTMLDivElement | null) => void
}

function BlockRow({
  block,
  blockIndex,
  onContentChange,
  onToggleTodo,
  onKeyDown,
  onInsertBlock,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging,
  isDragOver,
  registerRef,
}: BlockRowProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isGutterHovered, setIsGutterHovered] = useState(false)
  const [localContent, setLocalContent] = useState(block.content)
  const contentRef = useRef<HTMLDivElement | null>(null)
  
  // Show gutter controls if block OR gutter is hovered
  const showGutterControls = isHovered || isGutterHovered

  // Sync local content with prop
  useEffect(() => {
    setLocalContent(block.content)
  }, [block.content])

  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.textContent || ""
      setLocalContent(newContent)
      onContentChange(newContent)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown(e, localContent)
  }

  // Drag handlers
  const handleDragStartEvent = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", block.id)
    onDragStart()
  }

  const handleDragEndEvent = () => {
    onDragEnd()
  }

  const handleDragOverEvent = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    onDragOver()
  }

  // Render divider block
  if (block.type === "divider") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          marginTop: "1px",
          marginBottom: "1px",
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isDragOver ? "rgba(35, 131, 226, 0.1)" : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOverEvent}
      >
        {/* Gutter controls */}
        <GutterControls
          isVisible={showGutterControls}
          onInsertBlock={onInsertBlock}
          onDragStart={handleDragStartEvent}
          onDragEnd={handleDragEndEvent}
          onGutterHoverChange={setIsGutterHovered}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "13px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(55, 53, 47, 0.16)",
            }}
          />
        </div>
      </div>
    )
  }

  // Render callout block
  if (block.type === "callout") {
    return (
      <div
        style={{
          position: "relative",
          marginBottom: "32px",
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isDragOver ? "rgba(35, 131, 226, 0.1)" : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOverEvent}
      >
        {/* Gutter controls */}
        <GutterControls
          isVisible={showGutterControls}
          onInsertBlock={onInsertBlock}
          onDragStart={handleDragStartEvent}
          onDragEnd={handleDragEndEvent}
          onGutterHoverChange={setIsGutterHovered}
        />
        <div
          style={{
            display: "flex",
            width: "100%",
            borderRadius: "10px",
            background: "#f1f1ef",
            paddingInline: "12px 20px",
            paddingTop: "16px",
            paddingBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
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
              color: "#37352f",
            }}
          >
            <span>
              <strong style={{ fontWeight: 600 }}>Notion Tip:</strong> Use this
              template to write quick notes you can reference later and quickly
              create a rich document. You can embed links, images, to-do&apos;s, and
              more. Learn more about the different types of content blocks{" "}
              <a
                href="https://www.notion.so/help/guides/types-of-content-blocks"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "inherit",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(55, 53, 47, 0.4)",
                  textUnderlineOffset: "3px",
                  cursor: "pointer",
                }}
              >
                here
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Render heading block
  if (block.type === "heading") {
    return (
      <div
        style={{
          position: "relative",
          marginTop: "2em",
          marginBottom: "4px",
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isDragOver ? "rgba(35, 131, 226, 0.1)" : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOverEvent}
      >
        {/* Gutter controls */}
        <GutterControls
          isVisible={showGutterControls}
          onInsertBlock={onInsertBlock}
          onDragStart={handleDragStartEvent}
          onDragEnd={handleDragEndEvent}
          onGutterHoverChange={setIsGutterHovered}
        />
        <h2
          ref={(el) => {
            contentRef.current = el
            registerRef(el)
          }}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            fontSize: "1.875em",
            fontWeight: 600,
            lineHeight: 1.3,
            color: "#37352f",
            outline: "none",
            cursor: "text",
          }}
        >
          {block.content}
        </h2>
      </div>
    )
  }

  // Render todo block
  if (block.type === "todo") {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          width: "100%",
          paddingInlineStart: "2px",
          marginTop: "1px",
          marginBottom: "1px",
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isDragOver ? "rgba(35, 131, 226, 0.1)" : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOverEvent}
      >
        {/* Gutter controls */}
        <GutterControls
          isVisible={showGutterControls}
          onInsertBlock={onInsertBlock}
          onDragStart={handleDragStartEvent}
          onDragEnd={handleDragEndEvent}
          onGutterHoverChange={setIsGutterHovered}
        />

        {/* Checkbox */}
        <div
          style={{
            marginInlineEnd: "2px",
            width: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            minHeight: "calc(1.5em + 6px)",
          }}
        >
          <div
            onClick={onToggleTodo}
            style={{
              position: "relative",
              flexShrink: 0,
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 200ms ease-out",
              borderRadius: "1.5px",
              background: block.checked ? "rgb(35, 131, 226)" : "transparent",
              border: block.checked ? "none" : "1.5px solid rgba(55, 53, 47, 0.65)",
              cursor: "pointer",
            }}
          >
            {block.checked && (
              <svg
                viewBox="0 0 16 16"
                style={{
                  width: "14px",
                  height: "14px",
                  display: "block",
                  fill: "white",
                  flexShrink: 0,
                }}
              >
                <path d="M11.62 3.18a.876.876 0 0 1 1.5.9l-5.244 8.74a.876.876 0 0 1-1.414.12L2.966 8.86a.875.875 0 1 1 1.328-1.138L7 10.879z" />
              </svg>
            )}
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: "1 1 0px", minWidth: "1px", display: "flex", flexDirection: "column" }}>
          <div
            ref={(el) => {
              contentRef.current = el
              registerRef(el)
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{
              maxWidth: "100%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              paddingTop: "3px",
              paddingBottom: "3px",
              paddingInline: "2px",
              textAlign: "start",
              flexGrow: 1,
              outline: "none",
              cursor: "text",
              fontSize: "16px",
              lineHeight: 1.5,
              color: block.checked ? "rgba(55, 53, 47, 0.5)" : "#37352f",
              textDecoration: block.checked ? "line-through" : "none",
              textDecorationColor: block.checked ? "rgba(55, 53, 47, 0.5)" : "transparent",
            }}
          >
            {block.content}
          </div>
        </div>
      </div>
    )
  }

  // Render paragraph block (default)
  return (
    <div
      style={{
        position: "relative",
        marginTop: "8px",
        marginBottom: "8px",
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragOver ? "rgba(35, 131, 226, 0.1)" : "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOverEvent}
    >
      {/* Gutter controls */}
      <GutterControls
        isVisible={showGutterControls}
        onInsertBlock={onInsertBlock}
        onDragStart={handleDragStartEvent}
        onDragEnd={handleDragEndEvent}
        onGutterHoverChange={setIsGutterHovered}
      />
      <div
        ref={(el) => {
          contentRef.current = el
          registerRef(el)
        }}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        data-placeholder="Type something..."
        style={{
          fontSize: "16px",
          lineHeight: 1.5,
          color: "#37352f",
          outline: "none",
          cursor: "text",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          paddingTop: "3px",
          paddingBottom: "3px",
          minHeight: "1.5em",
        }}
      >
        {block.content}
      </div>
    </div>
  )
}

// Gutter controls component (+ and drag handle)
interface GutterControlsProps {
  isVisible: boolean
  onInsertBlock: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onGutterHoverChange: (isHovered: boolean) => void
}

function GutterControls({ isVisible, onInsertBlock, onDragStart, onDragEnd, onGutterHoverChange }: GutterControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "-56px",
        top: "1px",
        width: "52px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: isVisible ? 1 : 0,
        pointerEvents: "auto", // Always allow pointer events so we can detect hover
        transition: "opacity 150ms ease",
      }}
      onMouseEnter={() => onGutterHoverChange(true)}
      onMouseLeave={() => onGutterHoverChange(false)}
    >
      {/* Plus button - inserts paragraph block below */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onInsertBlock()
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        title="Add block"
        className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
      </button>

      {/* Drag handle - six-dot grip for reordering */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
        className="h-7 w-7 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-grab active:cursor-grabbing transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <GripVertical className="w-4 h-4" strokeWidth={2} />
      </div>
    </div>
  )
}
