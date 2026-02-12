"use client"

import { useRef, useEffect } from "react"
import { Block as BlockType } from "@/lib/types"

interface BlockProps {
  block: BlockType
  isFocused: boolean
  placeholder?: string
  onFocus: (blockId: string) => void
  onTextChange: (blockId: string, text: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string) => void
}

export function Block({
  block,
  isFocused,
  placeholder = "Type '/' for commands",
  onFocus,
  onTextChange,
  onKeyDown,
}: BlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Determine styling based on block type (must be defined before useEffects)
  const isHeading = block.type === "heading1"

  // Auto-focus when block becomes focused
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isFocused])

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.max(scrollHeight, isHeading ? 32 : 24)}px`
    }
  }, [block.text, isHeading])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(block.id, e.target.value)
  }

  const handleFocus = () => {
    onFocus(block.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown(e, block.id)
  }

  const baseClasses = "w-full bg-transparent border-none outline-none resize-none overflow-hidden caret-gray-900"
  const textClasses = isHeading
    ? "text-[24px] font-semibold text-gray-900 mt-6 mb-2 leading-[1.3]"
    : "text-[16px] text-gray-700 leading-[1.6]"

  return (
    <div className="block-wrapper">
      <textarea
        ref={textareaRef}
        value={block.text}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${baseClasses} ${textClasses} placeholder:text-gray-400`}
        rows={1}
        style={{
          fontFamily: "inherit",
          minHeight: isHeading ? "2rem" : "1.5rem",
        }}
      />
    </div>
  )
}
