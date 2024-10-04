import React from 'react';
import { LocalNode } from '@/types/nodes';
import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DocumentProps {
  node: LocalNode;
}

export const Document = ({ node }: DocumentProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'document_get',
    nodeId: node.id,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  return <DocumentEditor key={node.id} node={node} nodes={data?.nodes} />;
};