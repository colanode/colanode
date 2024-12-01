import {
  DatabaseNode,
  hasEditorAccess,
  NodeRole,
  RecordNode,
} from '@colanode/core';

import { Database } from '@/renderer/components/databases/database';
import { Document } from '@/renderer/components/documents/document';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Separator } from '@/renderer/components/ui/separator';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface RecordBodyProps {
  record: RecordNode;
  recordRole: NodeRole;
  database: DatabaseNode;
  databaseRole: NodeRole;
}

export const RecordBody = ({
  record,
  recordRole,
  database,
  databaseRole,
}: RecordBodyProps) => {
  const workspace = useWorkspace();
  const canEdit =
    record.createdBy === workspace.userId || hasEditorAccess(recordRole);

  return (
    <Database database={database} role={databaseRole}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <RecordProvider record={record} role={recordRole}>
          <RecordAttributes />
        </RecordProvider>
        <Separator className="my-4 w-full" />
        <Document
          nodeId={record.id}
          content={record.attributes.content}
          transactionId={record.transactionId}
          canEdit={canEdit}
        />
      </ScrollArea>
    </Database>
  );
};
