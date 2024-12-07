import { Block } from '../registry/block';

const collectText = (
  blockId: string,
  blocks: Record<string, Block>
): string => {
  const texts: string[] = [];

  // Extract text from the current block's leaf nodes
  const block = blocks[blockId];
  if (block) {
    let text = '';
    if (block.content) {
      for (const leaf of block.content) {
        if (leaf.text) {
          text += leaf.text;
        }
      }
    }
    texts.push(text);
  }

  // Find children and sort them by their index to maintain a stable order
  const children = Object.values(blocks)
    .filter((child) => child.parentId === blockId)
    .sort((a, b) => a.index.localeCompare(b.index));

  // Recursively collect text from children
  for (const child of children) {
    texts.push(collectText(child.id, blocks));
  }

  return texts.join('\n');
};

export const extractText = (
  nodeId: string,
  blocks: Record<string, Block> | undefined | null
): string | null => {
  if (!blocks) {
    return null;
  }

  const result = collectText(nodeId, blocks);
  return result.length > 0 ? result : null;
};
