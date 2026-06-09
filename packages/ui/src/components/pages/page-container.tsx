import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';
import { NodeBacklinks } from '@colanode/ui/components/nodes/node-backlinks';
import { NodeOutline } from '@colanode/ui/components/nodes/node-outline';

interface PageContainerProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageContainer = ({ page, role }: PageContainerProps) => {
  const canEdit = hasNodeRole(role, 'editor');
  return (
    <div className="flex flex-row items-start gap-4">
      <div className="min-w-0 flex-1">
        <Document node={page} canEdit={canEdit} autoFocus="start" />
        <NodeBacklinks nodeId={page.id} />
      </div>
      <NodeOutline documentId={page.id} />
    </div>
  );
};
