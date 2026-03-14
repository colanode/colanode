import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

import { postNavigateNode } from '../bridge';

export const MobilePageNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;
  const [name, setName] = useState<string>('Loading...');

  useEffect(() => {
    if (!id) return;

    window.colanode
      .executeQuery({
        type: 'node.list',
        userId: '',
        filters: [{ field: ['id'], operator: 'eq', value: id }],
        sorts: [],
        limit: 1,
      })
      .then((nodes) => {
        if (nodes && nodes.length > 0) {
          setName(nodes[0].name || 'Unnamed');
        } else {
          setName('Unnamed');
        }
      })
      .catch(() => {
        setName('Unnamed');
      });
  }, [id]);

  if (!id) return null;

  return (
    <NodeViewWrapper data-id={node.attrs.id}>
      <div
        className="my-0.5 flex h-10 w-full cursor-pointer flex-row items-center gap-2 rounded-md p-2 hover:bg-accent active:bg-accent"
        onClick={() => postNavigateNode(id, 'page')}
      >
        <FileText size={18} className="text-muted-foreground shrink-0" />
        <span className="truncate">{name}</span>
      </div>
    </NodeViewWrapper>
  );
};
