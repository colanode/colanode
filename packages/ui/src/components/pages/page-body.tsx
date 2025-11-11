import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';

interface PageBodyProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return <Document node={page} canEdit={canEdit} autoFocus="start" />;
};
