import {
  EditorNodeTypes,
  generateId,
  getIdTypeFromNode,
  generateNodeIndex,
} from '@colanode/core';
import { compareString } from '@/shared/lib/utils';
import { JSONContent } from '@tiptap/core';
import { Block, BlockLeaf } from '@colanode/core';

const leafBlockTypes = new Set([
  EditorNodeTypes.Paragraph,
  EditorNodeTypes.Heading1,
  EditorNodeTypes.Heading2,
  EditorNodeTypes.Heading3,
  EditorNodeTypes.HorizontalRule,
  EditorNodeTypes.CodeBlock,
]);

export const mapContentsToBlocks = (
  parentId: string,
  contents: JSONContent[],
  blocksMap: Map<string, Block>
): Block[] => {
  const blocks: Block[] = [];
  mapAndPushContentsToBlocks(contents, parentId, blocks, blocksMap);
  validateBlocksIndexes(blocks);
  return blocks;
};

const mapAndPushContentsToBlocks = (
  contents: JSONContent[] | null | undefined,
  parentId: string,
  blocks: Block[],
  blocksMap: Map<string, Block>
): void => {
  if (!contents) {
    return;
  }
  contents.map((content) => {
    mapAndPushContentToBlock(content, parentId, blocks, blocksMap);
  });
};

const mapAndPushContentToBlock = (
  content: JSONContent,
  parentId: string,
  blocks: Block[],
  blocksMap: Map<string, Block>
): void => {
  if (!content.type) {
    throw new Error('Invalid content type');
  }

  const id = getIdFromContent(content);
  const index = blocksMap.get(id)?.index;
  const attrs =
    (content.attrs &&
      Object.entries(content.attrs).filter(([key]) => key !== 'id')) ??
    [];

  const isLeafBlock = leafBlockTypes.has(content.type);
  const blockContent = isLeafBlock
    ? mapContentsToBlockLeafs(content.type, content.content)
    : null;

  blocks.push({
    id: id,
    index: index ?? generateNodeIndex(null, null),
    attrs: attrs.length > 0 ? Object.fromEntries(attrs) : null,
    parentId: parentId,
    type: content.type,
    content: blockContent?.filter((leaf) => leaf !== null) ?? null,
  });

  if (!isLeafBlock && content.content) {
    mapAndPushContentsToBlocks(content.content, id, blocks, blocksMap);
  }
};

const mapContentsToBlockLeafs = (
  type: string,
  contents?: JSONContent[]
): BlockLeaf[] | null => {
  if (!leafBlockTypes.has(type) || contents == null || contents.length === 0) {
    return null;
  }

  const nodeBlocks: BlockLeaf[] = [];
  for (const content of contents) {
    if (!content.type) {
      continue;
    }

    nodeBlocks.push({
      type: content.type,
      text: content.text ?? '',
      marks:
        content.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs ?? null,
          };
        }) ?? null,
    });
  }
  return nodeBlocks;
};

export const mapBlocksToContents = (
  parentId: string,
  blocks: Block[]
): JSONContent[] => {
  const contents: JSONContent[] = [];
  const children = blocks
    .filter((block) => block.parentId === parentId)
    .sort((a, b) => compareString(a.index, b.index));

  for (const child of children) {
    contents.push(mapBlockToContent(child, blocks));
  }

  return contents;
};

const mapBlockToContent = (block: Block, blocks: Block[]): JSONContent => {
  return {
    type: block.type,
    attrs: {
      id: block.id,
      ...block.attrs,
    },
    content: leafBlockTypes.has(block.type)
      ? mapBlockLeafsToContents(block.content)
      : mapBlocksToContents(block.id, blocks),
  };
};

const mapBlockLeafsToContents = (
  leafs: BlockLeaf[] | null
): JSONContent[] | undefined => {
  if (leafs == null) {
    return undefined;
  }
  const contents: JSONContent[] = [];
  for (const leaf of leafs) {
    contents.push({
      type: leaf.type,
      text: leaf.text,
      marks:
        leaf.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs ?? undefined,
          };
        }) ?? undefined,
    });
  }
  return contents;
};

const validateBlocksIndexes = (blocks: Block[]) => {
  //group by parentId
  const groupedBlocks: { [key: string]: Block[] } = {};
  for (const block of blocks) {
    const parentBlocks = groupedBlocks[block.parentId] ?? [];
    parentBlocks.push(block);
    groupedBlocks[block.parentId] = parentBlocks;
  }

  for (const parentId in groupedBlocks) {
    const blocks = groupedBlocks[parentId];
    if (!blocks) {
      continue;
    }

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const beforeBlock = blocks[i - 1];

      if (!currentBlock || !beforeBlock) {
        continue;
      }

      const currentIndex = currentBlock.index;
      const beforeIndex = beforeBlock.index;

      if (currentIndex <= beforeIndex) {
        const afterBlock = i < blocks.length - 1 ? blocks[i + 1] : null;
        const afterIndex = afterBlock?.index ?? null;
        if (
          afterIndex &&
          afterIndex > currentIndex &&
          afterIndex > beforeIndex
        ) {
          currentBlock.index = generateNodeIndex(beforeIndex, afterIndex);
        } else {
          currentBlock.index = generateNodeIndex(beforeIndex, null);
        }
      }
    }
  }
};

const getIdFromContent = (content: JSONContent): string => {
  if (!content.type) {
    throw new Error('Invalid content type');
  }

  return content.attrs?.id ?? generateId(getIdTypeFromNode(content.type));
};

export const editorHasContent = (block?: JSONContent) => {
  if (!block) {
    return false;
  }

  if (block.text && block.text?.length > 0) {
    return true;
  }

  if (block.type === 'file' && block.attrs?.fileId) {
    return true;
  }

  if (block.type === 'upload' && block.attrs?.uploadId) {
    return true;
  }

  if (block.type === 'gif' && block.attrs?.gifId) {
    return true;
  }

  if (block.type === 'emoji' && block.attrs?.emoji) {
    return true;
  }

  if (block.content && block.content?.length > 0) {
    for (let i = 0; i < block.content.length; i += 1) {
      const innerBlock = block.content[i];
      if (editorHasContent(innerBlock)) {
        return true;
      }
    }
  }

  return false;
};
