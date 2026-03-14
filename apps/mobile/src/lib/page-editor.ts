import {
  Block,
  BlockLeaf,
  compareString,
  generateId,
  generateFractionalIndex,
  IdType,
} from '@colanode/core';

export interface EditableBlock {
  id: string;
  type: string;
  text: string;
  attrs?: Record<string, any>;
  editable: boolean;
  checked?: boolean;
}

const SIMPLE_EDITABLE_TYPES = new Set([
  'paragraph',
  'heading1',
  'heading2',
  'heading3',
  'horizontalRule',
]);

const LIST_PARENT_TYPES = new Set([
  'bulletList',
  'orderedList',
  'taskList',
]);

export const blocksToEditModel = (
  documentId: string,
  blocks: Block[]
): EditableBlock[] => {
  const result: EditableBlock[] = [];
  const topLevel = blocks
    .filter((b) => b.parentId === documentId)
    .sort((a, b) => compareString(a.index, b.index));

  for (const block of topLevel) {
    if (SIMPLE_EDITABLE_TYPES.has(block.type)) {
      result.push({
        id: block.id,
        type: block.type,
        text: extractText(block),
        attrs: block.attrs,
        editable: true,
      });
    } else if (block.type === 'blockquote') {
      // Blockquote contains inner paragraph blocks
      const children = blocks
        .filter((b) => b.parentId === block.id)
        .sort((a, b) => compareString(a.index, b.index));
      for (const child of children) {
        result.push({
          id: child.id,
          type: 'blockquote',
          text: extractText(child),
          attrs: { blockquoteId: block.id },
          editable: true,
        });
      }
      if (children.length === 0) {
        result.push({
          id: block.id,
          type: 'blockquote',
          text: '',
          editable: true,
        });
      }
    } else if (LIST_PARENT_TYPES.has(block.type)) {
      const listItems = blocks
        .filter((b) => b.parentId === block.id)
        .sort((a, b) => compareString(a.index, b.index));
      for (const item of listItems) {
        const innerBlocks = blocks
          .filter((b) => b.parentId === item.id)
          .sort((a, b) => compareString(a.index, b.index));
        const paragraph = innerBlocks.find((b) => b.type === 'paragraph');
        const text = paragraph ? extractText(paragraph) : '';

        if (block.type === 'taskList') {
          result.push({
            id: item.id,
            type: 'taskItem',
            text,
            editable: true,
            checked: item.attrs?.checked ?? false,
            attrs: { listId: block.id, paragraphId: paragraph?.id },
          });
        } else {
          const listType = block.type === 'bulletList' ? 'bulletItem' : 'orderedItem';
          result.push({
            id: item.id,
            type: listType,
            text,
            editable: true,
            attrs: { listId: block.id, paragraphId: paragraph?.id },
          });
        }
      }
    } else {
      // Unsupported block (table, codeBlock, file, folder, page, database, etc.)
      result.push({
        id: block.id,
        type: block.type,
        text: extractText(block),
        attrs: block.attrs,
        editable: false,
      });
    }
  }

  if (result.length === 0) {
    result.push({
      id: generateId(IdType.Block),
      type: 'paragraph',
      text: '',
      editable: true,
    });
  }

  return result;
};

const extractText = (block: Block): string => {
  if (!block.content) return '';
  return block.content
    .filter((leaf) => leaf.type === 'text' && leaf.text)
    .map((leaf) => leaf.text!)
    .join('');
};

export const editModelToBlocks = (
  documentId: string,
  editableBlocks: EditableBlock[],
  originalBlocks: Record<string, Block>,
  indexMap: Map<string, string>
): Record<string, Block> => {
  const result: Record<string, Block> = {};

  // First, preserve all non-editable original blocks and their children
  const preservedTopLevel = new Set<string>();
  for (const eb of editableBlocks) {
    if (!eb.editable) {
      preservedTopLevel.add(eb.id);
    }
  }

  // Collect preserved block trees
  for (const id of preservedTopLevel) {
    preserveBlockTree(id, originalBlocks, result);
  }

  // Now build editable blocks
  let prevIndex: string | null = null;
  // Track list groupings: consecutive items of the same list type share a parent
  let currentListId: string | null = null;
  let currentListType: string | null = null;
  let listItemPrevIndex: string | null = null;

  for (const eb of editableBlocks) {
    if (!eb.editable) {
      // Already preserved above; just track index
      const existing = originalBlocks[eb.id];
      prevIndex = existing?.index ?? indexMap.get(eb.id) ?? generateFractionalIndex(prevIndex, null);
      currentListId = null;
      currentListType = null;
      listItemPrevIndex = null;
      continue;
    }

    const blockType = mapEditableTypeToBlockType(eb.type);

    if (blockType === 'list') {
      const { listParentType, itemType } = getListInfo(eb.type);

      // Check if we should continue existing list or start new one
      if (currentListType !== listParentType) {
        // Start a new list parent
        currentListId = eb.attrs?.listId ?? generateId(IdType.Block);
        currentListType = listParentType;
        listItemPrevIndex = null;

        const listIndex = indexMap.get(currentListId) ?? generateFractionalIndex(prevIndex, null);
        result[currentListId] = {
          id: currentListId,
          type: listParentType,
          parentId: documentId,
          index: listIndex,
          content: null,
        };
        prevIndex = listIndex;
      }

      // Create list item
      const itemIndex = indexMap.get(eb.id) ?? generateFractionalIndex(listItemPrevIndex, null);
      const itemAttrs = itemType === 'taskItem' ? { checked: eb.checked ?? false } : undefined;
      result[eb.id] = {
        id: eb.id,
        type: itemType,
        parentId: currentListId!,
        index: itemIndex,
        content: null,
        attrs: itemAttrs,
      };
      listItemPrevIndex = itemIndex;

      // Create inner paragraph
      const paragraphId = eb.attrs?.paragraphId ?? generateId(IdType.Block);
      const paragraphIndex = indexMap.get(paragraphId) ?? generateFractionalIndex(null, null);
      result[paragraphId] = {
        id: paragraphId,
        type: 'paragraph',
        parentId: eb.id,
        index: paragraphIndex,
        content: textToLeafs(eb.text),
      };
    } else if (eb.type === 'blockquote') {
      // Group consecutive blockquote rows into a single blockquote parent
      const blockquoteId = eb.attrs?.blockquoteId ?? generateId(IdType.Block);
      if (!result[blockquoteId]) {
        const bqIndex = indexMap.get(blockquoteId) ?? generateFractionalIndex(prevIndex, null);
        result[blockquoteId] = {
          id: blockquoteId,
          type: 'blockquote',
          parentId: documentId,
          index: bqIndex,
          content: null,
        };
        prevIndex = bqIndex;
      }
      currentListId = null;
      currentListType = null;
      listItemPrevIndex = null;

      const innerIndex = indexMap.get(eb.id) ?? generateFractionalIndex(null, null);
      result[eb.id] = {
        id: eb.id,
        type: 'paragraph',
        parentId: blockquoteId,
        index: innerIndex,
        content: textToLeafs(eb.text),
      };
    } else if (eb.type === 'horizontalRule') {
      currentListId = null;
      currentListType = null;
      listItemPrevIndex = null;

      const hrIndex = indexMap.get(eb.id) ?? generateFractionalIndex(prevIndex, null);
      result[eb.id] = {
        id: eb.id,
        type: 'horizontalRule',
        parentId: documentId,
        index: hrIndex,
        content: null,
      };
      prevIndex = hrIndex;
    } else {
      // Simple leaf block (paragraph, heading1/2/3)
      currentListId = null;
      currentListType = null;
      listItemPrevIndex = null;

      const blockIndex = indexMap.get(eb.id) ?? generateFractionalIndex(prevIndex, null);
      result[eb.id] = {
        id: eb.id,
        type: eb.type,
        parentId: documentId,
        index: blockIndex,
        content: textToLeafs(eb.text),
        attrs: eb.attrs,
      };
      prevIndex = blockIndex;
    }
  }

  return result;
};

const preserveBlockTree = (
  id: string,
  originalBlocks: Record<string, Block>,
  result: Record<string, Block>
) => {
  const block = originalBlocks[id];
  if (!block) return;
  result[id] = { ...block };

  // Recursively preserve children
  for (const [childId, childBlock] of Object.entries(originalBlocks)) {
    if (childBlock.parentId === id) {
      preserveBlockTree(childId, originalBlocks, result);
    }
  }
};

const textToLeafs = (text: string): BlockLeaf[] | null => {
  if (!text) return null;
  return [{ type: 'text', text }];
};

const mapEditableTypeToBlockType = (type: string): string => {
  switch (type) {
    case 'bulletItem':
    case 'orderedItem':
    case 'taskItem':
      return 'list';
    default:
      return type;
  }
};

const getListInfo = (editableType: string) => {
  switch (editableType) {
    case 'bulletItem':
      return { listParentType: 'bulletList', itemType: 'listItem' };
    case 'orderedItem':
      return { listParentType: 'orderedList', itemType: 'listItem' };
    case 'taskItem':
      return { listParentType: 'taskList', itemType: 'taskItem' };
    default:
      throw new Error(`Unknown list type: ${editableType}`);
  }
};

export const BLOCK_TYPE_OPTIONS = [
  { type: 'paragraph', label: 'Text' },
  { type: 'heading1', label: 'Heading 1' },
  { type: 'heading2', label: 'Heading 2' },
  { type: 'heading3', label: 'Heading 3' },
  { type: 'bulletItem', label: 'Bullet list' },
  { type: 'orderedItem', label: 'Numbered list' },
  { type: 'taskItem', label: 'Task' },
  { type: 'blockquote', label: 'Quote' },
  { type: 'horizontalRule', label: 'Divider' },
] as const;

export const getBlockTypeLabel = (type: string): string => {
  const option = BLOCK_TYPE_OPTIONS.find((o) => o.type === type);
  return option?.label ?? type;
};

export const createEmptyBlock = (type: string): EditableBlock => {
  return {
    id: generateId(IdType.Block),
    type,
    text: '',
    editable: true,
    checked: type === 'taskItem' ? false : undefined,
  };
};

export const getNextBlockType = (currentType: string): string => {
  // After divider, create paragraph
  if (currentType === 'horizontalRule') return 'paragraph';
  // Otherwise same type
  return currentType;
};
