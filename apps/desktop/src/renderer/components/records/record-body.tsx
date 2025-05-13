import { NodeRole, hasNodeRole } from '@colanode/core';
import { LocalRecordNode } from '@colanode/client/types';

import { Document } from '@/renderer/components/documents/document';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { RecordDatabase } from '@/renderer/components/records/record-database';

interface RecordBodyProps {
  record: LocalRecordNode;
  role: NodeRole;
}

export const RecordBody = ({ record, role }: RecordBodyProps) => {
  const workspace = useWorkspace();

  const canEdit =
    record.createdBy === workspace.userId || hasNodeRole(role, 'editor');
  return (
    <RecordDatabase id={record.attributes.databaseId} role={role}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto">
        <RecordProvider record={record} role={role}>
          <RecordAttributes />
        </RecordProvider>
        <Separator className="my-4 w-full" />
        <Document node={record} canEdit={canEdit} autoFocus={false} />
      </ScrollArea>
    </RecordDatabase>
  );
};
