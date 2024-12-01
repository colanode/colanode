import { Block } from '@colanode/core';

import { DocumentEditor } from '@/renderer/components/documents/document-editor';
import { mapBlocksToContents } from '@/shared/lib/editor';

interface DocumentProps {
  nodeId: string;
  content?: Record<string, Block> | null;
  transactionId: string;
  canEdit: boolean;
}

export const Document = ({
  nodeId,
  content,
  transactionId,
  canEdit,
}: DocumentProps) => {
  const nodeBlocks = Object.values(content ?? {});
  const contents = mapBlocksToContents(nodeId, nodeBlocks);

  if (!contents.length) {
    contents.push({
      type: 'paragraph',
    });
  }

  const tiptapContent = {
    type: 'doc',
    content: contents,
  };

  return (
    <DocumentEditor
      key={nodeId}
      documentId={nodeId}
      content={tiptapContent}
      transactionId={transactionId}
      canEdit={canEdit}
    />
  );
};
