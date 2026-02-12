"use client"

import { Pencil, Copy, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface PageMenuProps {
  pageId: string
  pageTitle: string
  onRename: (pageId: string) => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
}

export function PageMenu({
  pageId,
  pageTitle,
  onRename,
  onDuplicate,
  onDelete,
}: PageMenuProps) {
  const handleRename = () => {
    onRename(pageId)
  }

  const handleDuplicate = () => {
    onDuplicate(pageId)
  }

  const handleDelete = () => {
    onDelete(pageId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => {
            // Prevent row selection when clicking menu trigger
            e.stopPropagation()
          }}
          className="h-[20px] w-[20px] flex items-center justify-center rounded-[4px] hover:bg-[rgba(55,53,47,0.08)] focus:outline-none transition-colors duration-100"
          aria-label={`Menu for ${pageTitle}`}
        >
          <MoreHorizontal className="h-[14px] w-[14px] text-[rgba(55,53,47,0.5)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleRename}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
