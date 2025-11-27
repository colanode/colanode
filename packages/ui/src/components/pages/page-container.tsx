import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';

interface PageContainerProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageContainer = ({ page, role }: PageContainerProps) => {
  const canEdit = hasNodeRole(role, 'editor');
  return <Document node={page} canEdit={canEdit} autoFocus="start" />;
};
