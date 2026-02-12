import { Doc, Block, BlockType } from "./types"
import { generatePageId } from "./tree"

/**
 * Generate a unique block ID
 */
function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new block with default values
 */
export function createBlock(type: BlockType = "paragraph", text: string = ""): Block {
  return {
    id: generateBlockId(),
    type,
    text,
  }
}

/**
 * Update a block's text in a document
 * Returns a new document with the updated block
 */
export function updateBlockText(
  doc: Doc,
  blockId: string,
  newText: string
): Doc {
  return {
    ...doc,
    blocks: doc.blocks.map((block) =>
      block.id === blockId ? { ...block, text: newText } : block
    ),
  }
}

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
 * Update document title
 * Returns a new document with updated title
 */
export function updateDocumentTitle(doc: Doc, newTitle: string): Doc {
  return {
    ...doc,
    title: newTitle,
  }
}

/**
 * Find the index of a block by ID
 */
export function findBlockIndex(doc: Doc, blockId: string): number {
  return doc.blocks.findIndex((b) => b.id === blockId)
}

/**
 * Get the previous block ID (or null if first block)
 */
export function getPreviousBlockId(doc: Doc, blockId: string): string | null {
  const index = findBlockIndex(doc, blockId)
  if (index <= 0) return null
  return doc.blocks[index - 1].id
}

/**
 * Get the next block ID (or null if last block)
 */
export function getNextBlockId(doc: Doc, blockId: string): string | null {
  const index = findBlockIndex(doc, blockId)
  if (index === -1 || index >= doc.blocks.length - 1) return null
  return doc.blocks[index + 1].id
}
