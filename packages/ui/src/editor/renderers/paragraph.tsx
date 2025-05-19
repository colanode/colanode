import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';
import { cn } from '@colanode/ui/lib/utils';

interface ParagraphRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const ParagraphRenderer = ({
  node,
  keyPrefix,
}: ParagraphRendererProps) => {
  return (
    <p className={cn(defaultClasses.paragraph, 'py-0.5')}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </p>
  );
};
