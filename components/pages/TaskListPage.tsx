"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Plus, LayoutGrid, Filter, ArrowUpDown, Zap, Search, SlidersHorizontal, ChevronDown, MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"

interface Task {
  id: string
  title: string
  icon?: string
  status: string // Column ID
}

interface Column {
  id: string
  title: string
  color: string
  bgColor: string
  pillBgColor: string
  pillTextColor: string
  countColor: string
  cardHoverBg: string // Card hover background tint
  icon?: string
}

// Color palette for generating new columns (similar to existing colors)
const colorPalette = [
  { // Red/Pink
    color: "#e16259",
    bgColor: "rgba(255, 226, 221, 0.35)",
    pillBgColor: "rgba(255, 192, 184, 0.5)",
    pillTextColor: "#93514c",
    countColor: "#c4837e",
    cardHoverBg: "rgba(255, 226, 221, 0.5)",
  },
  { // Orange/Yellow
    color: "#d9a54c",
    bgColor: "rgba(253, 236, 200, 0.4)",
    pillBgColor: "rgba(250, 222, 150, 0.5)",
    pillTextColor: "#89632a",
    countColor: "#c9a356",
    cardHoverBg: "rgba(253, 236, 200, 0.6)",
  },
  { // Green
    color: "#6a9b5b",
    bgColor: "rgba(219, 237, 219, 0.4)",
    pillBgColor: "rgba(183, 223, 183, 0.5)",
    pillTextColor: "#4a7c4a",
    countColor: "#7aab7a",
    cardHoverBg: "rgba(219, 237, 219, 0.5)",
  },
  { // Blue
    color: "#5b93c6",
    bgColor: "rgba(211, 229, 239, 0.4)",
    pillBgColor: "rgba(183, 213, 235, 0.5)",
    pillTextColor: "#3d6a8f",
    countColor: "#7aa3c4",
    cardHoverBg: "rgba(211, 229, 239, 0.5)",
  },
  { // Purple
    color: "#9b7bc9",
    bgColor: "rgba(232, 222, 238, 0.4)",
    pillBgColor: "rgba(215, 197, 232, 0.5)",
    pillTextColor: "#6b4d8a",
    countColor: "#a98fc4",
    cardHoverBg: "rgba(232, 222, 238, 0.5)",
  },
  { // Teal
    color: "#4d9b8a",
    bgColor: "rgba(211, 236, 229, 0.4)",
    pillBgColor: "rgba(183, 223, 213, 0.5)",
    pillTextColor: "#3a7568",
    countColor: "#7ab5a6",
    cardHoverBg: "rgba(211, 236, 229, 0.5)",
  },
  { // Brown
    color: "#a67c52",
    bgColor: "rgba(238, 224, 211, 0.4)",
    pillBgColor: "rgba(225, 205, 183, 0.5)",
    pillTextColor: "#7a5a3d",
    countColor: "#b99a7a",
    cardHoverBg: "rgba(238, 224, 211, 0.5)",
  },
]

const defaultColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "#e16259",
    bgColor: "rgba(255, 226, 221, 0.35)",
    pillBgColor: "rgba(255, 192, 184, 0.5)",
    pillTextColor: "#93514c",
    countColor: "#c4837e",
    cardHoverBg: "rgba(255, 226, 221, 0.5)",
  },
  {
    id: "doing",
    title: "Doing",
    color: "#d9a54c",
    bgColor: "rgba(253, 236, 200, 0.4)",
    pillBgColor: "rgba(250, 222, 150, 0.5)",
    pillTextColor: "#89632a",
    countColor: "#c9a356",
    cardHoverBg: "rgba(253, 236, 200, 0.6)",
  },
  {
    id: "done",
    title: "Done",
    color: "#6a9b5b",
    bgColor: "rgba(219, 237, 219, 0.4)",
    pillBgColor: "rgba(183, 223, 183, 0.5)",
    pillTextColor: "#4a7c4a",
    countColor: "#7aab7a",
    cardHoverBg: "rgba(219, 237, 219, 0.5)",
    icon: "🙌",
  },
]

// Generate a random color scheme from the palette
function getRandomColorScheme() {
  const randomIndex = Math.floor(Math.random() * colorPalette.length)
  return colorPalette[randomIndex]
}

const defaultTasks: Task[] = [
  { id: "task-1", title: "Take Fig on a walk", icon: "🐶", status: "doing" },
  { id: "task-2", title: "Complete project review", status: "todo" },
]

// ============================================
// Local Storage Persistence
// ============================================
const TASK_STORAGE_KEY = "notion-task-list-state"
const TASK_STORAGE_VERSION = "1.0.0"

interface StoredTaskState {
  version: string
  tasks: Task[]
}

function isValidTask(obj: unknown): obj is Task {
  if (typeof obj !== "object" || obj === null) return false
  const task = obj as Record<string, unknown>
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    (task.icon === undefined || typeof task.icon === "string") &&
    typeof task.status === "string"
  )
}

function isValidColumn(obj: unknown): obj is Column {
  if (typeof obj !== "object" || obj === null) return false
  const col = obj as Record<string, unknown>
  return (
    typeof col.id === "string" &&
    typeof col.title === "string" &&
    typeof col.color === "string" &&
    typeof col.bgColor === "string" &&
    typeof col.pillBgColor === "string" &&
    typeof col.pillTextColor === "string" &&
    typeof col.countColor === "string" &&
    typeof col.cardHoverBg === "string"
  )
}

interface StoredBoardState {
  version: string
  tasks: Task[]
  columns: Column[]
  pageTitle?: string
  pageDescription?: string
}

function isValidStoredTaskState(obj: unknown): obj is StoredTaskState {
  if (typeof obj !== "object" || obj === null) return false
  const state = obj as Record<string, unknown>
  return (
    typeof state.version === "string" &&
    Array.isArray(state.tasks) &&
    state.tasks.every(isValidTask)
  )
}

function isValidStoredBoardState(obj: unknown): obj is StoredBoardState {
  if (typeof obj !== "object" || obj === null) return false
  const state = obj as Record<string, unknown>
  return (
    typeof state.version === "string" &&
    Array.isArray(state.tasks) &&
    state.tasks.every(isValidTask) &&
    Array.isArray(state.columns) &&
    state.columns.every(isValidColumn)
  )
}

function loadBoardFromStorage(): { tasks: Task[], columns: Column[], pageTitle?: string, pageDescription?: string } {
  if (typeof window === "undefined") {
    return { tasks: defaultTasks, columns: defaultColumns }
  }

  try {
    const raw = window.localStorage.getItem(TASK_STORAGE_KEY)
    if (!raw) {
      return { tasks: defaultTasks, columns: defaultColumns }
    }

    const parsed = JSON.parse(raw)

    // New format with columns
    if (isValidStoredBoardState(parsed)) {
      return { 
        tasks: parsed.tasks, 
        columns: parsed.columns,
        pageTitle: parsed.pageTitle,
        pageDescription: parsed.pageDescription,
      }
    }

    // Legacy format (tasks only)
    if (isValidStoredTaskState(parsed)) {
      return { tasks: parsed.tasks, columns: defaultColumns }
    }

    // Try to recover if it's just an array of tasks
    if (Array.isArray(parsed) && parsed.every(isValidTask)) {
      return { tasks: parsed, columns: defaultColumns }
    }

    console.warn("Invalid board storage format, using defaults")
    return { tasks: defaultTasks, columns: defaultColumns }
  } catch (error) {
    console.error("Error loading board from storage:", error)
    return { tasks: defaultTasks, columns: defaultColumns }
  }
}

function saveBoardToStorage(tasks: Task[], columns: Column[], pageTitle?: string, pageDescription?: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const stored: StoredBoardState = {
      version: TASK_STORAGE_VERSION,
      tasks,
      columns,
      pageTitle,
      pageDescription,
    }
    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded, cannot save board")
    } else {
      console.error("Error saving board to storage:", error)
    }
  }
}

// ============================================
// CardMenuPopover Component (Portal-based)
// ============================================
interface CardMenuPopoverProps {
  isOpen: boolean
  onClose: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

function CardMenuPopover({
  isOpen,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  anchorRef,
}: CardMenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  const MENU_WIDTH = 220
  const MENU_HEIGHT = 140 // Approximate height of menu

  // Calculate position based on anchor element
  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return

    const rect = anchorRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = rect.bottom + 4 // 4px gap below button
    let left = rect.right - MENU_WIDTH // Align right edge with button

    // Collision detection: flip above if overflows bottom
    if (top + MENU_HEIGHT > viewportHeight - 16) {
      top = rect.top - MENU_HEIGHT - 4
    }

    // Collision detection: flip left if overflows right
    if (left < 16) {
      left = rect.left
    }

    // Ensure doesn't overflow right
    if (left + MENU_WIDTH > viewportWidth - 16) {
      left = viewportWidth - MENU_WIDTH - 16
    }

    // Ensure doesn't overflow left
    if (left < 16) {
      left = 16
    }

    setPosition({ top, left })
  }, [anchorRef])

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update position when menu opens
  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  // Handle click outside and escape
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    // Handle scroll/resize to reposition
    const handleScrollResize = () => {
      updatePosition()
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    window.addEventListener("scroll", handleScrollResize, true)
    window.addEventListener("resize", handleScrollResize)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
      window.removeEventListener("scroll", handleScrollResize, true)
      window.removeEventListener("resize", handleScrollResize)
    }
  }, [isOpen, onClose, anchorRef, updatePosition])

  if (!isOpen || !mounted) return null

  const menuContent = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${MENU_WIDTH}px`,
        backgroundColor: "white",
        border: "1px solid rgba(55, 53, 47, 0.09)",
        borderRadius: "6px",
        boxShadow: "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px",
        zIndex: 9999,
        fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ padding: "4px 0" }}>
        <button
          onClick={() => {
            onRename()
            onClose()
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 12px",
            height: "36px",
            fontSize: "14px",
            color: "#37352f",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background-color 80ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(55, 53, 47, 0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Pencil style={{ width: "16px", height: "16px", color: "rgba(55, 53, 47, 0.65)" }} />
          <span>Rename</span>
        </button>

        <button
          onClick={() => {
            onDuplicate()
            onClose()
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 12px",
            height: "36px",
            fontSize: "14px",
            color: "#37352f",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background-color 80ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(55, 53, 47, 0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Copy style={{ width: "16px", height: "16px", color: "rgba(55, 53, 47, 0.65)" }} />
          <span>Duplicate</span>
        </button>

        <div style={{ margin: "4px 0", borderTop: "1px solid rgba(55, 53, 47, 0.09)" }} />

        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 12px",
            height: "36px",
            fontSize: "14px",
            color: "#eb5757",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background-color 80ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(235, 87, 87, 0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Trash2 style={{ width: "16px", height: "16px", color: "#eb5757" }} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )

  // Render in portal to document.body
  return createPortal(menuContent, document.body)
}

// ============================================
// SortableCardItem Component (Draggable)
// ============================================
interface SortableCardItemProps {
  task: Task
  hoverBgColor: string
  onRename: (taskId: string, newTitle: string) => void
  onDuplicate: (taskId: string) => void
  onDelete: (taskId: string) => void
  isDragging?: boolean
}

function SortableCardItem({ task, hoverBgColor, onRename, onDuplicate, onDelete, isDragging }: SortableCardItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(task.title)
  const [isHovered, setIsHovered] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: isRenaming })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      // Place cursor at end of text
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [isRenaming])

  const handleRenameStart = () => {
    setRenameValue(task.title)
    setIsRenaming(true)
  }

  const handleRenameSave = () => {
    if (renameValue.trim()) {
      onRename(task.id, renameValue.trim())
    }
    setIsRenaming(false)
  }

  const handleRenameCancel = () => {
    setRenameValue(task.title)
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleRenameSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleRenameCancel()
    }
  }

  return (
    // Outer wrapper: overflow visible to allow action rail to render outside if needed
    <div
      ref={setNodeRef}
      style={{
        ...style,
        overflow: "visible",
        position: "relative",
      }}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group cursor-grab transition-all ${
        isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Inner card: has rounded corners, border, shadow - visual container */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "8px",
          // When editing: white background with blue border (like Notion)
          // When hovering: tinted background
          // Default: white background
          border: isRenaming 
            ? "1px solid rgba(35, 131, 226, 0.5)" 
            : "1px solid rgba(227, 226, 224, 0.5)",
          boxShadow: isRenaming
            ? "rgba(35, 131, 226, 0.25) 0px 0px 0px 2px"
            : "rgba(15, 15, 15, 0.03) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 2px 4px",
          backgroundColor: isRenaming ? "white" : (isHovered ? hoverBgColor : "white"),
          overflow: "hidden", // Clip content to rounded corners
          position: "relative", // For any inner positioned elements
          transition: "background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
        }}
      >
        <div className="flex items-center gap-2">
          {task.icon && <span className="text-[16px]">{task.icon}</span>}
          
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSave}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                fontSize: "14px",
                fontWeight: 400,
                color: "#37352f",
                backgroundColor: "transparent", // Card is already white when editing
                border: "none",
                outline: "none",
                padding: 0,
                margin: 0,
                width: "100%",
                fontFamily: "inherit",
                lineHeight: "inherit",
              }}
              placeholder="Type a name..."
            />
          ) : (
            <span className="flex-1 text-[14px] text-gray-900">{task.title}</span>
          )}
        </div>
      </div>

      {/* Action Rail - hidden by default, fades in on hover, stays visible while editing */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          // When editing, keep rail visible
          opacity: isRenaming ? 1 : undefined,
          visibility: isRenaming ? "visible" : undefined,
          pointerEvents: isRenaming ? "auto" : undefined,
          transition: "opacity 150ms, visibility 150ms",
        }}
        className={isRenaming ? "" : "opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto"}
      >
        {/* Button Group Container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "24px",
            backgroundColor: "var(--c-whiButBac, white)",
            boxShadow: "var(--c-shaSM, rgba(15, 15, 15, 0.04) 0px 0px 0px 1px, rgba(15, 15, 15, 0.03) 0px 2px 4px)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {/* Pencil Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRenameStart()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: "24px",
              height: "24px",
              padding: 0,
              border: "none",
              borderInlineEnd: "1px solid var(--ca-borSecTra, rgba(55, 53, 47, 0.09))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              cursor: "pointer",
              transition: "background-color 80ms ease",
              color: "rgba(55, 53, 47, 0.45)",
              fill: "rgba(55, 53, 47, 0.45)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(55, 53, 47, 0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <svg
              aria-hidden="true"
              role="graphics-symbol"
              viewBox="0 0 16 16"
              style={{
                width: "16px",
                height: "16px",
                display: "block",
                fill: "inherit",
                flexShrink: 0,
                color: "inherit",
              }}
            >
              <path d="M11.243 3.457a.803.803 0 0 0-1.13 0l-.554.552a.075.075 0 0 0 0 .106l1.03 1.03a.075.075 0 0 0 .107 0l.547-.546a.1.1 0 0 0 .019-.032.804.804 0 0 0-.02-1.11m-2.246 1.22a.075.075 0 0 0-.106 0l-6.336 6.326a1.1 1.1 0 0 0-.237.393l-.27.87v.002c-.062.232.153.466.389.383l.863-.267q.221-.061.397-.239l6.332-6.331a.075.075 0 0 0 0-.106zm-3.355 6.898a.08.08 0 0 0-.053.022l-1.1 1.1a.075.075 0 0 0 .053.128h9.06a.625.625 0 1 0 0-1.25z" />
            </svg>
          </button>

          {/* Ellipsis Button */}
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: "24px",
              height: "24px",
              padding: 0,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              cursor: "pointer",
              transition: "background-color 80ms ease",
              color: "rgba(55, 53, 47, 0.45)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(55, 53, 47, 0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <MoreHorizontal style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      <CardMenuPopover
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onRename={handleRenameStart}
        onDuplicate={() => onDuplicate(task.id)}
        onDelete={() => onDelete(task.id)}
        anchorRef={menuButtonRef}
      />
    </div>
  )
}

// ============================================
// CardOverlay Component (for DragOverlay)
// ============================================
function CardOverlay({ task }: { task: Task }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(227, 226, 224, 0.5)",
        boxShadow: "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.15) 0px 4px 8px, rgba(15, 15, 15, 0.2) 0px 8px 16px",
        backgroundColor: "white",
        cursor: "grabbing",
      }}
    >
      <div className="flex items-center gap-2">
        {task.icon && <span className="text-[16px]">{task.icon}</span>}
        <span className="flex-1 text-[14px] text-gray-900">{task.title}</span>
      </div>
    </div>
  )
}

// ============================================
// ColumnMenuPopover Component (Portal-based)
// ============================================
interface ColumnMenuPopoverProps {
  isOpen: boolean
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

function ColumnMenuPopover({
  isOpen,
  onClose,
  onRename,
  onDelete,
  anchorRef,
}: ColumnMenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  const MENU_WIDTH = 200
  const MENU_HEIGHT = 100

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return

    const rect = anchorRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = rect.bottom + 4
    let left = rect.right - MENU_WIDTH

    if (top + MENU_HEIGHT > viewportHeight - 16) {
      top = rect.top - MENU_HEIGHT - 4
    }

    if (left < 16) {
      left = rect.left
    }

    if (left + MENU_WIDTH > viewportWidth - 16) {
      left = viewportWidth - MENU_WIDTH - 16
    }

    setPosition({ top, left })
  }, [anchorRef])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen || !mounted) return null

  const menuContent = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${MENU_WIDTH}px`,
        backgroundColor: "white",
        border: "1px solid rgba(55, 53, 47, 0.09)",
        borderRadius: "6px",
        boxShadow: "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px",
        zIndex: 9999,
        fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ padding: "4px 0" }}>
        <button
          onClick={() => {
            onRename()
            onClose()
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 12px",
            height: "36px",
            fontSize: "14px",
            color: "#37352f",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background-color 80ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(55, 53, 47, 0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Pencil style={{ width: "16px", height: "16px", color: "rgba(55, 53, 47, 0.65)" }} />
          <span>Rename</span>
        </button>

        <div style={{ margin: "4px 0", borderTop: "1px solid rgba(55, 53, 47, 0.09)" }} />

        <button
          onClick={() => {
            onDelete()
            onClose()
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 12px",
            height: "36px",
            fontSize: "14px",
            color: "#eb5757",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background-color 80ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(235, 87, 87, 0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Trash2 style={{ width: "16px", height: "16px", color: "#eb5757" }} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )

  return createPortal(menuContent, document.body)
}

// ============================================
// DroppableColumn Component
// ============================================
interface DroppableColumnProps {
  column: Column
  tasks: Task[]
  isOver: boolean
  onRenameTask: (taskId: string, newTitle: string) => void
  onDuplicateTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onAddTask: (columnId: string) => void
  onRenameColumn: (columnId: string, newTitle: string) => void
  onDeleteColumn: (columnId: string) => void
}

function DroppableColumn({
  column,
  tasks,
  isOver,
  onRenameTask,
  onDuplicateTask,
  onDeleteTask,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(column.title)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleRenameStart = () => {
    setRenameValue(column.title)
    setIsRenaming(true)
  }

  const handleRenameSave = () => {
    if (renameValue.trim()) {
      onRenameColumn(column.id, renameValue.trim())
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleRenameSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setRenameValue(column.title)
      setIsRenaming(false)
    }
  }

  return (
    <div
      className="group/column"
      style={{
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: "260px",
        height: "max-content",
        paddingInline: "16px",
        paddingTop: "14px",
        paddingBottom: "14px",
        borderRadius: "14px",
        backgroundColor: isOver ? "rgba(35, 131, 226, 0.08)" : column.bgColor,
        border: isOver ? "2px dashed rgba(35, 131, 226, 0.4)" : "none",
        transition: "background-color 150ms ease, border 150ms ease",
        overflow: "visible",
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
          fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameSave}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.1,
              backgroundColor: "white",
              color: column.pillTextColor,
              border: "1px solid rgba(35, 131, 226, 0.5)",
              boxShadow: "rgba(35, 131, 226, 0.25) 0px 0px 0px 2px",
              outline: "none",
              minWidth: "80px",
            }}
          />
        ) : (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.1,
              backgroundColor: column.pillBgColor,
              color: column.pillTextColor,
            }}
          >
            {column.title}
          </span>
        )}
        {column.icon && <span style={{ fontSize: "14px" }}>{column.icon}</span>}
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: column.countColor,
          }}
        >
          {tasks.length}
        </span>

        {/* Spacer to push buttons to the right */}
        <div style={{ flex: 1 }} />

        {/* Column Action Buttons - visible on hover */}
        <div
          className="opacity-0 group-hover/column:opacity-100"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "opacity 150ms ease",
          }}
        >
          {/* Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              cursor: "pointer",
              transition: "background-color 80ms ease",
              color: column.pillTextColor,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <MoreHorizontal style={{ width: "16px", height: "16px" }} />
          </button>

          {/* Add Task Button */}
          <button
            onClick={() => onAddTask(column.id)}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              cursor: "pointer",
              transition: "background-color 80ms ease",
              color: column.pillTextColor,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        <ColumnMenuPopover
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onRename={handleRenameStart}
          onDelete={() => onDeleteColumn(column.id)}
          anchorRef={menuButtonRef}
        />
      </div>

      {/* Tasks Container (Droppable) */}
      <div
        ref={setNodeRef}
        style={{
          minHeight: tasks.length === 0 ? "60px" : "auto",
          overflow: "visible",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflow: "visible" }}>
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableCardItem
                key={task.id}
                task={task}
                hoverBgColor={column.cardHoverBg}
                onRename={onRenameTask}
                onDuplicate={onDuplicateTask}
                onDelete={onDeleteTask}
              />
            ))}
          </SortableContext>

          {/* Add New Page Button */}
          <button
            onClick={() => onAddTask(column.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              fontSize: "14px",
              borderRadius: "6px",
              border: `1px dashed ${column.color}40`,
              color: column.color,
              backgroundColor: "transparent",
              cursor: "pointer",
              transition: "background-color 150ms ease",
            }}
            className="hover:bg-white/50"
          >
            <Plus className="w-4 h-4" />
            New page
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TaskListPage Component
// ============================================
const DEFAULT_PAGE_TITLE = "Task List"
const DEFAULT_PAGE_DESCRIPTION = "Use this template to track your personal tasks."

export function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
  
  // Page header state
  const [pageTitle, setPageTitle] = useState(DEFAULT_PAGE_TITLE)
  const [pageDescription, setPageDescription] = useState(DEFAULT_PAGE_DESCRIPTION)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  
  // New group creation state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const newGroupInputRef = useRef<HTMLInputElement>(null)

  // Load board from localStorage on mount
  useEffect(() => {
    const { tasks: storedTasks, columns: storedColumns, pageTitle: storedTitle, pageDescription: storedDesc } = loadBoardFromStorage()
    setTasks(storedTasks)
    setColumns(storedColumns)
    if (storedTitle) setPageTitle(storedTitle)
    if (storedDesc) setPageDescription(storedDesc)
    setIsLoaded(true)
  }, [])

  // Save board to localStorage whenever data changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveBoardToStorage(tasks, columns, pageTitle, pageDescription)
    }
  }, [tasks, columns, pageTitle, pageDescription, isLoaded])

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Focus description input when editing
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      descriptionInputRef.current.select()
    }
  }, [isEditingDescription])

  // Focus input when creating new group
  useEffect(() => {
    if (isCreatingGroup && newGroupInputRef.current) {
      newGroupInputRef.current.focus()
    }
  }, [isCreatingGroup])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get tasks for a specific column
  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.status === columnId)
  }

  // Find which column a task belongs to
  const findColumnForTask = (taskId: UniqueIdentifier): string | null => {
    const task = tasks.find(t => t.id === taskId)
    return task ? task.status : null
  }

  // Add a new task to a column
  const addTask = (columnId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "New task",
      status: columnId,
    }
    setTasks([...tasks, newTask])
  }

  // Create a new group/column
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setIsCreatingGroup(false)
      setNewGroupName("")
      return
    }

    const colorScheme = getRandomColorScheme()
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: newGroupName.trim(),
      ...colorScheme,
    }

    setColumns([...columns, newColumn])
    setIsCreatingGroup(false)
    setNewGroupName("")
  }

  const handleNewGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateGroup()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsCreatingGroup(false)
      setNewGroupName("")
    }
  }

  // Rename a task
  const renameCard = (taskId: string, newTitle: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, title: newTitle } : task
    ))
  }

  // Duplicate a task
  const duplicateCard = (taskId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) return

    const originalTask = tasks[taskIndex]
    const duplicatedTask: Task = {
      ...originalTask,
      id: `task-${Date.now()}`,
      title: `${originalTask.title} (copy)`,
    }

    const newTasks = [...tasks]
    newTasks.splice(taskIndex + 1, 0, duplicatedTask)
    setTasks(newTasks)
  }

  // Delete a task
  const deleteCard = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  // Rename a column
  const renameColumn = (columnId: string, newTitle: string) => {
    setColumns(columns.map(col =>
      col.id === columnId ? { ...col, title: newTitle } : col
    ))
  }

  // Delete a column (and all its tasks)
  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter(col => col.id !== columnId))
    setTasks(tasks.filter(task => task.status !== columnId))
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activeTaskId = active.id as string
    const overId = over.id as string

    // Find the source column
    const sourceColumn = findColumnForTask(activeTaskId)
    if (!sourceColumn) return

    // Determine target column
    let targetColumn: string
    let targetIndex: number

    // Check if dropping on a column directly
    if (columns.some(col => col.id === overId)) {
      targetColumn = overId
      targetIndex = getTasksForColumn(targetColumn).length
    } else {
      // Dropping on another task
      const overTaskColumn = findColumnForTask(overId)
      if (!overTaskColumn) return
      targetColumn = overTaskColumn
      const columnTasks = getTasksForColumn(targetColumn)
      targetIndex = columnTasks.findIndex(t => t.id === overId)
      if (targetIndex === -1) targetIndex = columnTasks.length
    }

    // If same column and same position, do nothing
    if (sourceColumn === targetColumn) {
      const columnTasks = getTasksForColumn(sourceColumn)
      const currentIndex = columnTasks.findIndex(t => t.id === activeTaskId)
      if (currentIndex === targetIndex || currentIndex === targetIndex - 1) {
        // Reorder within same column
        const newTasks = [...tasks]
        const taskToMove = newTasks.find(t => t.id === activeTaskId)
        if (!taskToMove) return

        // Remove from current position
        const filteredTasks = newTasks.filter(t => t.id !== activeTaskId)
        
        // Calculate new index in the full array
        const tasksBeforeTarget = filteredTasks.filter(
          t => t.status === targetColumn && 
          getTasksForColumn(targetColumn).filter(ct => ct.id !== activeTaskId).indexOf(t) < targetIndex
        )
        
        // Find insert position
        let insertIndex = 0
        for (let i = 0; i < filteredTasks.length; i++) {
          if (filteredTasks[i].status === targetColumn) {
            const colTasks = getTasksForColumn(targetColumn).filter(ct => ct.id !== activeTaskId)
            const taskIndexInCol = colTasks.findIndex(ct => ct.id === filteredTasks[i].id)
            if (taskIndexInCol >= targetIndex) {
              insertIndex = i
              break
            }
          }
          insertIndex = i + 1
        }

        filteredTasks.splice(insertIndex, 0, taskToMove)
        setTasks(filteredTasks)
        return
      }
    }

    // Move task to new column/position
    setTasks(prevTasks => {
      const taskToMove = prevTasks.find(t => t.id === activeTaskId)
      if (!taskToMove) return prevTasks

      // Remove task from current position
      const filteredTasks = prevTasks.filter(t => t.id !== activeTaskId)

      // Update task status
      const updatedTask = { ...taskToMove, status: targetColumn }

      // Find insert position in the filtered array
      const targetColumnTasks = filteredTasks.filter(t => t.status === targetColumn)
      
      if (targetIndex >= targetColumnTasks.length) {
        // Add at the end of the column
        const lastTaskOfColumn = targetColumnTasks[targetColumnTasks.length - 1]
        if (lastTaskOfColumn) {
          const lastIndex = filteredTasks.findIndex(t => t.id === lastTaskOfColumn.id)
          filteredTasks.splice(lastIndex + 1, 0, updatedTask)
        } else {
          // Empty column - find where to insert based on column order
          let insertPos = filteredTasks.length
          for (let i = 0; i < filteredTasks.length; i++) {
            const colIndex = columns.findIndex(c => c.id === filteredTasks[i].status)
            const targetColIndex = columns.findIndex(c => c.id === targetColumn)
            if (colIndex > targetColIndex) {
              insertPos = i
              break
            }
          }
          filteredTasks.splice(insertPos, 0, updatedTask)
        }
      } else {
        // Insert at specific position
        const taskAtTargetIndex = targetColumnTasks[targetIndex]
        if (taskAtTargetIndex) {
          const insertIndex = filteredTasks.findIndex(t => t.id === taskAtTargetIndex.id)
          filteredTasks.splice(insertIndex, 0, updatedTask)
        } else {
          filteredTasks.push(updatedTask)
        }
      }

      return filteredTasks
    })
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  // Show nothing while loading to prevent hydration mismatch
  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-[96px] py-[48px]">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[40px]">✔️</span>
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      setIsEditingTitle(false)
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      setIsEditingTitle(false)
                    }
                  }}
                  onBlur={() => setIsEditingTitle(false)}
                  placeholder="Untitled"
                  style={{
                    fontSize: "40px",
                    fontWeight: 700,
                    color: "#111827",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    padding: 0,
                    margin: 0,
                    width: "100%",
                    lineHeight: 1.2,
                  }}
                />
              ) : (
                <h1
                  className="text-[40px] font-bold text-gray-900 cursor-text hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {pageTitle || "Untitled"}
                </h1>
              )}
            </div>
            <div className="text-[14px] text-gray-600 leading-relaxed">
              {isEditingDescription ? (
                <textarea
                  ref={descriptionInputRef}
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault()
                      setIsEditingDescription(false)
                    }
                  }}
                  onBlur={() => setIsEditingDescription(false)}
                  placeholder="Add a description..."
                  style={{
                    fontSize: "14px",
                    color: "#4B5563",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "4px 8px",
                    margin: "-4px -8px",
                    width: "calc(100% + 16px)",
                    minHeight: "60px",
                    resize: "none",
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                    borderRadius: "4px",
                  }}
                  rows={3}
                />
              ) : (
                pageDescription && (
                  <p
                    className="cursor-text hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 transition-colors whitespace-pre-wrap"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {pageDescription}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Kanban Board with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", overflowX: "auto", overflowY: "visible", paddingBottom: "16px" }}>
              {columns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksForColumn(column.id)}
                  isOver={overId === column.id}
                  onRenameTask={renameCard}
                  onDuplicateTask={duplicateCard}
                  onDeleteTask={deleteCard}
                  onAddTask={addTask}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                />
              ))}

              {/* Add New Group */}
              <div className="flex-shrink-0" style={{ width: "260px" }}>
                {isCreatingGroup ? (
                  // New Group Input Prompt
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        border: "1px solid rgba(35, 131, 226, 0.5)",
                        boxShadow: "rgba(35, 131, 226, 0.25) 0px 0px 0px 2px",
                      }}
                    >
                      <input
                        ref={newGroupInputRef}
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={handleNewGroupKeyDown}
                        onBlur={handleCreateGroup}
                        placeholder="New group"
                        style={{
                          flex: 1,
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#37352f",
                          backgroundColor: "transparent",
                          border: "none",
                          outline: "none",
                          padding: 0,
                        }}
                      />
                      <button
                        onClick={handleCreateGroup}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "white",
                          backgroundColor: "#5c6bc0",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Done <span style={{ fontSize: "10px" }}>↵</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // New Group Button
                  <button
                    onClick={() => setIsCreatingGroup(true)}
                    className="flex items-center gap-2 px-3 py-2 text-[14px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New group
                  </button>
                )}
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? <CardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
