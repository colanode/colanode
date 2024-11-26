import { hasEditorAccess, NodeRole, PageNode } from '@colanode/core';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';

interface PageBodyProps {
  page: PageNode;
  role: NodeRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const canEdit = hasEditorAccess(role);

  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <Document
        nodeId={page.id}
        content={page.attributes.content}
        transactionId={page.transactionId}
        canEdit={canEdit}
      />
    </ScrollArea>
  );
};
