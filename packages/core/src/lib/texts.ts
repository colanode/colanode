import { Block } from '@colanode/core/registry/block';
import { DocumentContent } from '@colanode/core/registry/documents';

export const extractDocumentText = (id: string, content: DocumentContent) => {
  return extractBlockTexts(id, content.blocks);
};

export const extractBlockTexts = (
  nodeId: string,
  blocks: Record<string, Block> | undefined | null
): string | null => {
  if (!blocks) {
    return null;
  }

  const result = collectBlockText(nodeId, blocks);
  return result.length > 0 ? result : null;
};

const collectBlockText = (
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
    texts.push(collectBlockText(child.id, blocks));
  }

  return texts.join('\n');
};
