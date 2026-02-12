"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface RenameInputProps {
  initialValue: string
  onSave: (newTitle: string) => void
  onCancel: () => void
  className?: string
}

export function RenameInput({
  initialValue,
  onSave,
  onCancel,
  className,
}: RenameInputProps) {
  const [value, setValue] = useState(initialValue)
  const [wasCancelled, setWasCancelled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and select all text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setWasCancelled(true)
      onCancel()
    }
  }

  const handleBlur = () => {
    // Only save on blur if Esc wasn't pressed
    if (!wasCancelled) {
      handleSave()
    }
  }

  const handleSave = () => {
    const trimmed = value.trim()
    // Prevent empty string, fallback to "Untitled"
    const finalValue = trimmed || "Untitled"
    onSave(finalValue)
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()} // Prevent row selection
      className={cn(
        "flex-1 text-sm font-normal text-foreground bg-white border border-blue-500 rounded px-1.5 py-0.5 min-w-0",
        "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0",
        "transition-all duration-200",
        className
      )}
      style={{ fontSize: "14px", lineHeight: "1.4" }}
    />
  )
}
