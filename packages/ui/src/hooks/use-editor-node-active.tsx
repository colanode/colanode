import { type NodeViewProps } from '@tiptap/core';
import { useEffect, useState } from 'react';

interface UseNodeActiveOptions {
  /** Whether to check only exact node selection vs any selection within the node */
  exactMatch?: boolean;
  /** Whether to include nested nodes in the active check */
  includeNested?: boolean;
}

export const useEditorNodeActive = (
  props: Pick<NodeViewProps, 'editor' | 'node' | 'getPos'>,
  options: UseNodeActiveOptions = {}
) => {
  const { editor, node, getPos } = props;
  const { exactMatch = false, includeNested = true } = options;
  const [isActive, setIsActive] = useState(false);

  const checkIsActive = () => {
    if (!editor || !getPos || typeof getPos !== 'function') {
      return false;
    }

    const pos = getPos();
    if (pos === undefined) {
      return false;
    }

    const { selection } = editor.state;
    const nodeStart = pos;
    const nodeEnd = pos + node.nodeSize;

    if (exactMatch) {
      // Check if the entire node is selected
      return selection.from === nodeStart && selection.to === nodeEnd;
    }

    if (includeNested) {
      // Check if selection is within this node or any of its descendants
      return selection.from >= nodeStart && selection.to <= nodeEnd;
    }

    // Check if selection intersects with this node
    return !(selection.to <= nodeStart || selection.from >= nodeEnd);
  };

  useEffect(() => {
    if (!editor) return;

    const updateActiveState = () => {
      setIsActive(checkIsActive());
    };

    updateActiveState();

    editor.on('selectionUpdate', updateActiveState);
    editor.on('transaction', updateActiveState);

    return () => {
      editor.off('selectionUpdate', updateActiveState);
      editor.off('transaction', updateActiveState);
    };
  }, [editor, node, getPos, exactMatch, includeNested]);

  return isActive;
};
