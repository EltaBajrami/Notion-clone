import { Doc, Block, BlockType } from "./types"

/**
 * Generate a unique block ID
 */
function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new default document with title "Untitled" and one empty paragraph
 */
export function createDefaultDocument(): Doc {
  return {
    title: "Untitled",
    blocks: [
      {
        id: generateBlockId(),
        type: "paragraph",
        text: "",
      },
    ],
  }
}

/**
 * Create a block with default values
 */
export function createBlock(type: BlockType = "paragraph", text: string = ""): Block {
  return {
    id: generateBlockId(),
    type,
    text,
  }
}
