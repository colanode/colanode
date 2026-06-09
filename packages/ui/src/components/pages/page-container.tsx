import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';
import { NodeBacklinks } from '@colanode/ui/components/nodes/node-backlinks';

interface PageContainerProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageContainer = ({ page, role }: PageContainerProps) => {
  const canEdit = hasNodeRole(role, 'editor');
  return (
    <div className="flex flex-col">
      <Document node={page} canEdit={canEdit} autoFocus="start" />
      <NodeBacklinks nodeId={page.id} />
    </div>
  );
};
