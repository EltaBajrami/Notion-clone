import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get display title - returns "Untitled" for empty or whitespace-only titles
 */
export function getDisplayTitle(title: string | undefined | null): string {
  if (!title || title.trim() === "") {
    return "Untitled"
  }
  return title
}
