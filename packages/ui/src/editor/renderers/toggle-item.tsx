import { JSONContent } from '@tiptap/core';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface ToggleItemRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const ToggleItemRenderer = ({
  node,
  keyPrefix,
}: ToggleItemRendererProps) => {
  const [expanded, setExpanded] = useState(
    (node.attrs?.expanded as boolean) ?? false
  );

  const children = node.content ?? [];
  const titleNode = children[0];
  const nestedNodes = children.slice(1);

  return (
    <div className={defaultClasses.toggleItem}>
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          className="mt-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-muted"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </button>
        <div className="min-w-0 flex-1">
          {titleNode && (
            <NodeChildrenRenderer
              node={{ ...node, content: [titleNode] }}
              keyPrefix={keyPrefix}
            />
          )}
          {expanded && nestedNodes.length > 0 && (
            <NodeChildrenRenderer
              node={{ ...node, content: nestedNodes }}
              keyPrefix={keyPrefix ? `${keyPrefix}-nested` : 'nested'}
            />
          )}
        </div>
      </div>
    </div>
  );
};