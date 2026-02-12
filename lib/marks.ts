import { Block } from "./types"

export type MarkType = "bold" | "italic" | "underline"

export interface MarkRange {
  start: number
  end: number
  type: MarkType
}

export interface BlockMarks {
  ranges: MarkRange[]
}

/**
 * Normalize marks: merge adjacent same-type, clamp ranges, remove empty
 */
export function normalizeMarks(marks: BlockMarks | undefined, textLength: number): BlockMarks | undefined {
  if (!marks || !marks.ranges || marks.ranges.length === 0) {
    return undefined
  }

  // Clamp ranges to text length and remove empty ranges
  let validRanges = marks.ranges
    .map((range) => ({
      start: Math.max(0, Math.min(range.start, textLength)),
      end: Math.max(0, Math.min(range.end, textLength)),
      type: range.type,
    }))
    .filter((range) => range.start < range.end)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  if (validRanges.length === 0) {
    return undefined
  }

  // Merge adjacent ranges of the same type
  const merged: MarkRange[] = []
  for (const range of validRanges) {
    if (merged.length === 0) {
      merged.push({ ...range })
    } else {
      const last = merged[merged.length - 1]
      if (last.type === range.type && last.end >= range.start) {
        // Merge overlapping or adjacent ranges of same type
        last.end = Math.max(last.end, range.end)
      } else {
        merged.push({ ...range })
      }
    }
  }

  return { ranges: merged }
}

/**
 * Toggle a mark on the selected text range
 */
export function toggleMark(
  block: Block,
  type: MarkType,
  selectionStart: number,
  selectionEnd: number
): Block {
  if (selectionStart === selectionEnd) {
    return block // No selection, nothing to toggle
  }

  const textLength = block.text.length
  const start = Math.max(0, Math.min(selectionStart, textLength))
  const end = Math.max(0, Math.min(selectionEnd, textLength))

  if (start >= end) {
    return block
  }

  const currentMarks = normalizeMarks(block.marks, textLength)
  const ranges = currentMarks?.ranges || []

  // Check if the selection already has this mark
  const hasMark = ranges.some(
    (range) => range.type === type && range.start <= start && range.end >= end
  )

  let newRanges: MarkRange[]

  if (hasMark) {
    // Remove the mark from the selection
    newRanges = []
    for (const range of ranges) {
      if (range.type !== type) {
        // Keep other mark types
        newRanges.push({ ...range })
      } else {
        // Split or remove this mark type
        if (range.start < start && range.end > end) {
          // Split: selection is in the middle
          newRanges.push({ start: range.start, end: start, type: range.type })
          newRanges.push({ start: end, end: range.end, type: range.type })
        } else if (range.start < start && range.end > start) {
          // Trim end
          newRanges.push({ start: range.start, end: start, type: range.type })
        } else if (range.start < end && range.end > end) {
          // Trim start
          newRanges.push({ start: end, end: range.end, type: range.type })
        } else if (range.start >= start && range.end <= end) {
          // Completely remove (selection covers this range)
          // Don't add it
        } else {
          // Keep as-is
          newRanges.push({ ...range })
        }
      }
    }
  } else {
    // Add the mark
    newRanges = [...ranges, { start, end, type }]
  }

  // Normalize the result
  const normalized = normalizeMarks({ ranges: newRanges }, textLength)

  return {
    ...block,
    marks: normalized,
  }
}

/**
 * Apply text edit to marks, adjusting ranges for insertions/deletions
 */
export function applyTextEditToMarks(
  marks: BlockMarks | undefined,
  prevText: string,
  nextText: string,
  editStart: number,
  removedCount: number,
  addedCount: number
): BlockMarks | undefined {
  if (!marks || !marks.ranges || marks.ranges.length === 0) {
    return undefined
  }

  const delta = addedCount - removedCount
  const editEnd = editStart + removedCount

  const adjustedRanges: MarkRange[] = marks.ranges
    .map((range) => {
      // Ranges before the edit: no change
      if (range.end <= editStart) {
        return { ...range }
      }

      // Ranges after the edit: shift by delta
      if (range.start >= editEnd) {
        return {
          start: range.start + delta,
          end: range.end + delta,
          type: range.type,
        }
      }

      // Ranges that overlap with the edit
      // If the edit is inside the range, extend the range
      if (range.start < editStart && range.end > editEnd) {
        // Edit is inside the range, extend end by delta
        return {
          start: range.start,
          end: range.end + delta,
          type: range.type,
        }
      }

      // If range starts before edit and ends in edit
      if (range.start < editStart && range.end > editStart && range.end <= editEnd) {
        // Trim range to end at edit start
        return {
          start: range.start,
          end: editStart,
          type: range.type,
        }
      }

      // If range starts in edit and ends after
      if (range.start >= editStart && range.start < editEnd && range.end > editEnd) {
        // Move start to edit start + addedCount, shift end by delta
        return {
          start: editStart + addedCount,
          end: range.end + delta,
          type: range.type,
        }
      }

      // If range is completely inside edit, remove it (return null to filter)
      if (range.start >= editStart && range.end <= editEnd) {
        return null
      }

      return { ...range }
    })
    .filter((range): range is MarkRange => range !== null)

  return normalizeMarks({ ranges: adjustedRanges }, nextText.length)
}
