import { Doc, Block, BlockType } from "./types"
import { createBlock } from "./doc"
import { applyTextEditToMarks, normalizeMarks } from "./marks"

/**
 * Get the previous block ID (or null if first block)
 */
export function getPreviousBlockId(doc: Doc, blockId: string): string | null {
  const blockIndex = doc.blocks.findIndex((b) => b.id === blockId)
  if (blockIndex <= 0) return null
  return doc.blocks[blockIndex - 1].id
}

/**
 * Get the next block ID (or null if last block)
 */
export function getNextBlockId(doc: Doc, blockId: string): string | null {
  const blockIndex = doc.blocks.findIndex((b) => b.id === blockId)
  if (blockIndex === -1 || blockIndex >= doc.blocks.length - 1) return null
  return doc.blocks[blockIndex + 1].id
}

/**
 * Split a block at the cursor position
 * Returns a new document with the block split into two blocks
 */
export function splitBlockAtCursor(
  doc: Doc,
  blockId: string,
  cursorPosition: number
): { doc: Doc; newBlockId: string } {
  const blockIndex = doc.blocks.findIndex((b) => b.id === blockId)
  if (blockIndex === -1) {
    // Block not found, return original doc
    return { doc, newBlockId: "" }
  }

  const block = doc.blocks[blockIndex]
  const beforeText = block.text.slice(0, cursorPosition)
  const afterText = block.text.slice(cursorPosition)

  // Split marks: marks before cursor stay, marks after cursor move to new block
  let beforeMarks = block.marks
  let afterMarks = undefined

  if (block.marks && block.marks.ranges) {
    const beforeRanges = block.marks.ranges
      .filter((range) => range.end <= cursorPosition)
      .map((range) => ({ ...range }))
    const afterRanges = block.marks.ranges
      .filter((range) => range.start >= cursorPosition)
      .map((range) => ({
        start: range.start - cursorPosition,
        end: range.end - cursorPosition,
        type: range.type,
      }))

    beforeMarks = normalizeMarks({ ranges: beforeRanges }, beforeText.length)
    afterMarks = normalizeMarks({ ranges: afterRanges }, afterText.length)
  }

  // Create new block with text after cursor
  const newBlock: Block = {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: block.type,
    text: afterText,
    marks: afterMarks,
  }

  // Update current block with text before cursor
  const updatedBlock: Block = {
    ...block,
    text: beforeText,
    marks: beforeMarks,
  }

  // Insert new block after current block
  const newBlocks = [...doc.blocks]
  newBlocks[blockIndex] = updatedBlock
  newBlocks.splice(blockIndex + 1, 0, newBlock)

  return {
    doc: {
      ...doc,
      blocks: newBlocks,
    },
    newBlockId: newBlock.id,
  }
}

/**
 * Alias for splitBlockAtCursor (backward compatibility)
 */
export const splitBlock = splitBlockAtCursor

/**
 * Merge current block with previous block
 * Returns a new document with blocks merged and current block deleted
 */
export function mergeWithPrev(
  doc: Doc,
  blockId: string
): { doc: Doc; previousBlockId: string | null; mergePosition: number } {
  const blockIndex = doc.blocks.findIndex((b) => b.id === blockId)
  if (blockIndex <= 0) {
    // First block or not found, can't merge
    return { doc, previousBlockId: null, mergePosition: 0 }
  }

  const currentBlock = doc.blocks[blockIndex]
  const previousBlock = doc.blocks[blockIndex - 1]

  // Merge text: previous block text + current block text
  const mergedText = previousBlock.text + currentBlock.text
  const mergePosition = previousBlock.text.length

  // Merge marks: shift current block's marks by previous block's length
  let mergedMarks = previousBlock.marks
  if (currentBlock.marks && currentBlock.marks.ranges) {
    const shiftedRanges = currentBlock.marks.ranges.map((range) => ({
      start: range.start + mergePosition,
      end: range.end + mergePosition,
      type: range.type,
    }))
    const allRanges = [
      ...(previousBlock.marks?.ranges || []),
      ...shiftedRanges,
    ]
    mergedMarks = normalizeMarks({ ranges: allRanges }, mergedText.length)
  } else if (previousBlock.marks) {
    mergedMarks = normalizeMarks(previousBlock.marks, mergedText.length)
  }

  // Update previous block with merged text and marks
  const updatedPreviousBlock: Block = {
    ...previousBlock,
    text: mergedText,
    marks: mergedMarks,
  }

  // Remove current block
  const newBlocks = [...doc.blocks]
  newBlocks[blockIndex - 1] = updatedPreviousBlock
  newBlocks.splice(blockIndex, 1)

  return {
    doc: {
      ...doc,
      blocks: newBlocks,
    },
    previousBlockId: previousBlock.id,
    mergePosition,
  }
}

/**
 * Alias for mergeWithPrev (backward compatibility)
 */
export const mergeWithPrevious = mergeWithPrev

/**
 * Insert a new block after a given block ID
 * Returns a new document with the block inserted
 */
export function insertBlockAfter(
  doc: Doc,
  afterBlockId: string,
  newBlock: Block
): Doc {
  const blockIndex = doc.blocks.findIndex((b) => b.id === afterBlockId)
  if (blockIndex === -1) {
    // Block not found, append to end
    return {
      ...doc,
      blocks: [...doc.blocks, newBlock],
    }
  }

  const newBlocks = [...doc.blocks]
  newBlocks.splice(blockIndex + 1, 0, newBlock)
  return {
    ...doc,
    blocks: newBlocks,
  }
}

/**
 * Delete a block by ID
 * Returns a new document with the block removed
 * Ensures at least one block remains
 */
export function deleteBlock(doc: Doc, blockId: string): Doc {
  if (doc.blocks.length <= 1) {
    // Don't delete if it's the only block, just clear its text
    return {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.id === blockId ? { ...block, text: "" } : block
      ),
    }
  }

  return {
    ...doc,
    blocks: doc.blocks.filter((block) => block.id !== blockId),
  }
}

/**
 * Move a block from one index to another
 * Returns a new document with the block reordered
 */
export function moveBlock(doc: Doc, fromIndex: number, toIndex: number): Doc {
  if (fromIndex === toIndex) return doc
  if (fromIndex < 0 || fromIndex >= doc.blocks.length) return doc
  if (toIndex < 0 || toIndex >= doc.blocks.length) return doc

  const newBlocks = [...doc.blocks]
  const [movedBlock] = newBlocks.splice(fromIndex, 1)
  newBlocks.splice(toIndex, 0, movedBlock)

  return {
    ...doc,
    blocks: newBlocks,
  }
}

/**
 * Convert a block's type
 * Returns a new document with the updated block
 */
export function convertBlockType(doc: Doc, blockId: string, newType: BlockType): Doc {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId) {
        return block
      }
      
      // Initialize checked for todo blocks (always set to false if converting to todo)
      if (newType === "todo") {
        return {
          ...block,
          type: newType,
          checked: false,
        }
      }
      
      // Divider blocks should have empty text
      if (newType === "divider") {
        // Remove checked if it exists
        const { checked, ...rest } = block
        return {
          ...rest,
          type: newType,
          text: "",
        }
      }
      
      // For other block types, remove checked if it exists
      const { checked, ...rest } = block
      return {
        ...rest,
        type: newType,
      }
    }),
  }
}

/**
 * Update a block's text in a document
 * Returns a new document with the updated block
 * Adjusts marks based on text edit
 */
export function updateBlockText(
  doc: Doc,
  blockId: string,
  newText: string,
  prevText?: string,
  selectionStart?: number
): Doc {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId) {
        return block
      }

      const updatedBlock: Block = { ...block, text: newText }

      // Adjust marks if we have previous text and selection info
      if (prevText !== undefined && selectionStart !== undefined && block.marks) {
        const removedCount = Math.max(0, prevText.length - newText.length)
        const addedCount = Math.max(0, newText.length - prevText.length)
        const editStart = Math.min(selectionStart, prevText.length)
        
        updatedBlock.marks = applyTextEditToMarks(
          block.marks,
          prevText,
          newText,
          editStart,
          removedCount,
          addedCount
        )
      } else if (block.marks) {
        // No edit info, just normalize marks to new text length
        const { normalizeMarks } = require("./marks")
        updatedBlock.marks = normalizeMarks(block.marks, newText.length)
      }

      return updatedBlock
    }),
  }
}
