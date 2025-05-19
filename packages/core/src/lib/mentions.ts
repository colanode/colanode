import { Block } from '@colanode/core/registry/block';
import { Mention } from '@colanode/core/types/mentions';

export const extractBlocksMentions = (
  nodeId: string,
  blocks: Record<string, Block> | undefined | null
): Mention[] => {
  if (!blocks) {
    return [];
  }

  return collectBlockMentions(nodeId, blocks);
};

const collectBlockMentions = (
  blockId: string,
  blocks: Record<string, Block>
): Mention[] => {
  const mentions: Mention[] = [];

  // Extract text from the current block's leaf nodes
  const block = blocks[blockId];
  if (block) {
    if (block.content) {
      for (const leaf of block.content) {
        if (leaf.type === 'mention' && leaf.attrs?.target && leaf.attrs?.id) {
          mentions.push({
            id: leaf.attrs.id,
            target: leaf.attrs.target,
          });
        }
      }
    }
  }

  // Find children and sort them by their index to maintain a stable order
  const children = Object.values(blocks)
    .filter((child) => child.parentId === blockId)
    .sort((a, b) => a.index.localeCompare(b.index));

  // Recursively collect mentions from children
  for (const child of children) {
    mentions.push(...collectBlockMentions(child.id, blocks));
  }

  return mentions;
};
