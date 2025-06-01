import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';
import { ScrollArea } from '@colanode/ui/components/ui/scroll-area';

interface PageBodyProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto">
      <Document node={page} canEdit={canEdit} autoFocus="start" />
    </ScrollArea>
  );
};
