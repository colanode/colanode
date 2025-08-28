import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';

interface PageBodyProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <div className="h-full w-full overflow-y-auto">
      <ScrollArea className="overflow-hidden h-full">
        <ScrollViewport className="h-full max-h-[calc(100vh-100px)] w-full overflow-y-auto rounded-[inherit]">
          <Document node={page} canEdit={canEdit} autoFocus="start" />
        </ScrollViewport>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};
