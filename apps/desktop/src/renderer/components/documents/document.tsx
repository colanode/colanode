import { FocusPosition } from '@tiptap/core';
import { LocalNode } from '@colanode/client/types';

import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DocumentProps {
  node: LocalNode;
  canEdit: boolean;
  autoFocus?: FocusPosition;
}

export const Document = ({ node, canEdit, autoFocus }: DocumentProps) => {
  const workspace = useWorkspace();

  const { data: documentState, isPending: isDocumentStatePending } = useQuery({
    type: 'document_state_get',
    documentId: node.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const { data: documentUpdates, isPending: isDocumentUpdatesPending } =
    useQuery({
      type: 'document_updates_list',
      documentId: node.id,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    });

  if (isDocumentStatePending || isDocumentUpdatesPending) {
    return null;
  }

  const state = documentState ?? null;
  const updates = documentUpdates ?? [];

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
