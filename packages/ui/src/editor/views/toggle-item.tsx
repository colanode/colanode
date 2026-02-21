import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { ChevronRight } from 'lucide-react';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const ToggleItemNodeView = ({
  node,
  updateAttributes,
}: NodeViewProps) => {
  const expanded = node.attrs.expanded as boolean;

  return (
    <NodeViewWrapper
      data-type="toggleItem"
      className={`${defaultClasses.toggleItem}${expanded ? '' : ' toggle-collapsed'}`}
    >
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          contentEditable={false}
          className="mt-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-muted"
          onClick={() => updateAttributes({ expanded: !expanded })}
        >
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </button>
        <NodeViewContent className="toggle-item-content min-w-0 flex-1" />
      </div>
    </NodeViewWrapper>
  );
};