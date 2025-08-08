import { Editor, JSONContent } from '@tiptap/core';
import { Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { TableMap } from '@tiptap/pm/tables';
import { EditorView } from '@tiptap/pm/view';

import {
  Block,
  BlockLeaf,
  compareString,
  EditorNodeTypes,
  generateId,
  generateFractionalIndex,
  IdType,
  RichTextContent,
} from '@colanode/core';

interface TableCellAttrs {
  colspan: number;
  rowspan: number;
  colwidth: number[] | null;
  align?: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

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
  indexMap: Map<string, string>
): Record<string, Block> => {
  const blocks: Block[] = [];
  mapAndPushContentsToBlocks(contents, parentId, blocks, indexMap);
  validateBlocksIndexes(blocks);

  const blocksRecord: Record<string, Block> = blocks.reduce(
    (acc, block) => {
      acc[block.id] = block;
      return acc;
    },
    {} as Record<string, Block>
  );

  return blocksRecord;
};

const mapAndPushContentsToBlocks = (
  contents: JSONContent[] | null | undefined,
  parentId: string,
  blocks: Block[],
  indexMap: Map<string, string>
): void => {
  if (!contents) {
    return;
  }
  contents.map((content) => {
    mapAndPushContentToBlock(content, parentId, blocks, indexMap);
  });
};

const mapAndPushContentToBlock = (
  content: JSONContent,
  parentId: string,
  blocks: Block[],
  indexMap: Map<string, string>
): void => {
  if (!content.type) {
    throw new Error('Invalid content type');
  }

  const id = getIdFromContent(content);
  const index = indexMap.get(id);
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
    index: index ?? generateFractionalIndex(null, null),
    attrs: attrs.length > 0 ? Object.fromEntries(attrs) : undefined,
    parentId: parentId,
    type: content.type,
    content: blockContent?.filter((leaf) => leaf !== null),
  });

  if (!isLeafBlock && content.content) {
    mapAndPushContentsToBlocks(content.content, id, blocks, indexMap);
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
      text: content.text,
      attrs: content.attrs,
      marks: content.marks?.map((mark) => {
        return {
          type: mark.type,
          attrs: mark.attrs,
        };
      }),
    });
  }
  return nodeBlocks;
};

export const buildEditorContent = (
  documentId: string,
  content: RichTextContent | null | undefined
): JSONContent => {
  const blocks = content && content.blocks ? Object.values(content.blocks) : [];
  const contents = mapBlocksToContents(documentId, blocks);

  if (contents.length === 0) {
    contents.push({
      type: 'paragraph',
      content: [],
      attrs: {
        id: generateId(IdType.Block),
      },
    });
  }

  return {
    type: 'doc',
    content: contents,
  };
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
  const content: JSONContent = {
    type: block.type,
    attrs: {
      id: block.id,
      ...(block.attrs && block.attrs),
    },
  };

  const blockContent = leafBlockTypes.has(block.type)
    ? mapBlockLeafsToContents(block.content)
    : mapBlocksToContents(block.id, blocks);

  if (blockContent?.length) {
    content.content = blockContent;
  }

  return content;
};

const mapBlockLeafsToContents = (
  leafs: BlockLeaf[] | null | undefined
): JSONContent[] | undefined => {
  if (leafs == null || leafs === undefined || leafs.length === 0) {
    return undefined;
  }
  const contents: JSONContent[] = [];
  for (const leaf of leafs) {
    contents.push({
      type: leaf.type,
      ...(leaf.text && { text: leaf.text }),
      ...(leaf.attrs && { attrs: leaf.attrs }),
      ...(leaf.marks?.length && {
        marks: leaf.marks.map((mark) => ({
          type: mark.type,
          ...(mark.attrs && { attrs: mark.attrs }),
        })),
      }),
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
          currentBlock.index = generateFractionalIndex(beforeIndex, afterIndex);
        } else {
          currentBlock.index = generateFractionalIndex(beforeIndex, null);
        }
      }
    }
  }
};

const getIdFromContent = (content: JSONContent): string => {
  if (!content.type) {
    throw new Error('Invalid content type');
  }

  return content.attrs?.id ?? generateId(IdType.Block);
};

export const editorHasContent = (block?: JSONContent) => {
  if (!block) {
    return false;
  }

  if (block.text && block.text?.length > 0) {
    return true;
  }

  if (block.type === 'file' && block.attrs?.id) {
    return true;
  }

  if (block.type === 'tempFile' && block.attrs?.id) {
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

export const findNodePosById = (doc: ProseMirrorNode, id: string) => {
  let foundPos: number | null = null;

  doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (node?.attrs?.id === id) {
      foundPos = pos;
      return false; // stop search
    }
    return true;
  });

  return foundPos;
};

export const findBlockFromPos = (pos: ResolvedPos) => {
  for (let i = pos.depth; i >= 0; i--) {
    const node = pos.node(i);
    if (node?.attrs?.id) {
      return {
        nodeId: node.attrs.id,
        // offset within the text of that node
        offset:
          i === pos.depth
            ? pos.parentOffset // if the node at i is the text parent
            : pos.pos - pos.start(i), // general fallback
      };
    }
  }
  return null;
};

export type RelativeSelection =
  | {
      type: 'node';
      nodeId: string;
    }
  | {
      type: 'text';
      anchor: {
        nodeId: string;
        offset: number;
      };
      head: {
        nodeId: string;
        offset: number;
      };
    };

export const getRelativeSelection = (
  editor: Editor
): RelativeSelection | null => {
  const selection = editor.state.selection;
  if (selection instanceof NodeSelection) {
    const node = selection.node;
    if (node.attrs?.id) {
      return {
        type: 'node',
        nodeId: node.attrs.id,
      };
    }

    return null;
  }

  if (selection instanceof TextSelection) {
    const { $from, $head } = selection;

    const anchor = findBlockFromPos($from);
    const head = findBlockFromPos($head);

    if (anchor && head) {
      return {
        type: 'text',
        anchor,
        head,
      };
    }

    return null;
  }

  return null;
};

export const restoreRelativeSelection = (
  editor: Editor,
  selection: RelativeSelection
) => {
  const { state, view } = editor;
  const { doc } = state;
  let tr = state.tr;

  if (selection.type === 'node') {
    const pos = findNodePosById(doc, selection.nodeId);
    if (pos != null) {
      tr = tr.setSelection(NodeSelection.create(doc, pos));
      view.dispatch(tr);
    }

    return;
  }

  // Restore TextSelection
  if (selection.type === 'text') {
    const { anchor, head } = selection;

    const anchorNodePos = findNodePosById(doc, anchor.nodeId);
    const headNodePos = findNodePosById(doc, head.nodeId);

    if (anchorNodePos == null || headNodePos == null) {
      return;
    }

    const anchorNode = doc.nodeAt(anchorNodePos);
    const headNode = doc.nodeAt(headNodePos);

    if (!anchorNode || !headNode) {
      return;
    }

    const anchorTextSize = anchorNode.textContent?.length ?? 0;
    const headTextSize = headNode.textContent?.length ?? 0;

    const anchorOffset = Math.min(anchor.offset, anchorTextSize);
    const headOffset = Math.min(head.offset, headTextSize);

    const anchorAbsolutePos = anchorNodePos + 1 + anchorOffset;
    const headAbsolutePos = headNodePos + 1 + headOffset;

    const textSelection = TextSelection.create(
      doc,
      anchorAbsolutePos,
      headAbsolutePos
    );

    tr = tr.setSelection(textSelection);
    view.dispatch(tr);
  }
};

export const updateColumnWidth = (
  view: EditorView,
  cell: number,
  width: number
): void => {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1);
  const map = TableMap.get(table);
  const start = $cell.start(-1);

  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;

  const tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) {
      continue;
    }

    const pos = map.map[mapIndex];
    if (!pos) {
      continue;
    }

    const attrs = table.nodeAt(pos)!.attrs as TableCellAttrs;
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) {
      continue;
    }

    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : Array(attrs.colspan).fill(0);

    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth: colwidth });
  }

  if (tr.docChanged) {
    view.dispatch(tr);
  }
};

export const isDescendantNode = (
  ancestor: ProseMirrorNode,
  candidate: ProseMirrorNode
): boolean => {
  if (ancestor === candidate) return false;

  let found = false;

  ancestor.descendants((node) => {
    if (node === candidate) {
      found = true;
      return false; // break out early
    }
    return !found;
  });

  return found;
};

export const findClosestNodeAtPos = (
  doc: ProseMirrorNode,
  pos: number
): ProseMirrorNode | null => {
  let currentPos = pos;
  while (currentPos >= 0) {
    const node = doc.nodeAt(currentPos);
    if (node) {
      return node;
    }

    currentPos--;
  }

  return null;
};
