import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const MobileMentionNodeView = ({ node }: NodeViewProps) => {
  const target = node.attrs.target;
  const [name, setName] = useState<string>('...');

  useEffect(() => {
    if (!target) return;

    window.colanode
      .executeQuery({
        type: 'user.search',
        userId: '',
        searchQuery: '',
        exclude: [],
      })
      .then((users) => {
        const user = users?.find(
          (u: { id: string; name: string }) => u.id === target
        );
        setName(user?.name || 'Unknown');
      })
      .catch(() => {
        setName('Unknown');
      });
  }, [target]);

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className={defaultClasses.mention}
    >
      <span role="presentation">@{name}</span>
    </NodeViewWrapper>
  );
};
