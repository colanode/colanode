import { FocusPosition } from '@tiptap/core';

import { LocalNode } from '@colanode/client/types';
import { DocumentEditor } from '@colanode/ui/components/documents/document-editor';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface DocumentProps {
  node: LocalNode;
  canEdit: boolean;
  autoFocus?: FocusPosition;
}

export const Document = ({ node, canEdit, autoFocus }: DocumentProps) => {
  const workspace = useWorkspace();

  const documentStateQuery = useQuery({
    type: 'document.state.get',
    documentId: node.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const documentUpdatesQuery = useQuery({
    type: 'document.updates.list',
    documentId: node.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (documentStateQuery.isPending || documentUpdatesQuery.isPending) {
    return null;
  }

  const state = documentStateQuery.data ?? null;
  const updates = documentUpdatesQuery.data ?? [];

  return (
    <DocumentEditor
      key={node.id}
      node={node}
      state={state}
      updates={updates}
      canEdit={canEdit}
      autoFocus={autoFocus}
    />
  );
};
