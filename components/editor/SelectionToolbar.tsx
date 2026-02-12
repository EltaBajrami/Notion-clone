"use client"

import { MarkType } from "@/lib/marks"

interface SelectionToolbarProps {
  position: { top: number; left: number }
  onToggleMark: (type: MarkType, blockId: string, selectionStart: number, selectionEnd: number) => void
  activeMarks: Set<MarkType>
  blockId: string
  selectionStart: number
  selectionEnd: number
}

export function SelectionToolbar({
  position,
  onToggleMark,
  activeMarks,
  blockId,
  selectionStart,
  selectionEnd,
}: SelectionToolbarProps) {
  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-md px-2 py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)", // Center horizontally
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
      onMouseDown={(e) => {
        // Prevent blur when clicking toolbar
        e.preventDefault()
      }}
      onClick={(e) => {
        // Prevent event bubbling
        e.stopPropagation()
      }}
    >
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Pass selection directly to avoid stale state
                onToggleMark("bold", blockId, selectionStart, selectionEnd)
              }}
              onMouseUp={(e) => {
                // Prevent click event from propagating
                e.preventDefault()
                e.stopPropagation()
              }}
        title="Bold"
              className={`px-2 py-1 rounded text-[14px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 ${
                activeMarks.has("bold")
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              B
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleMark("italic", blockId, selectionStart, selectionEnd)
              }}
              onMouseUp={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
        title="Italic"
              className={`px-2 py-1 rounded text-[14px] italic transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 ${
                activeMarks.has("italic")
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              I
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleMark("underline", blockId, selectionStart, selectionEnd)
              }}
              onMouseUp={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
        title="Underline"
              className={`px-2 py-1 rounded text-[14px] underline transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 ${
                activeMarks.has("underline")
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              U
            </button>
    </div>
  )
}
