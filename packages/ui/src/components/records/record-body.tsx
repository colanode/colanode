import { LocalRecordNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';
import { RecordAttributes } from '@colanode/ui/components/records/record-attributes';
import { RecordDatabase } from '@colanode/ui/components/records/record-database';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

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
      <div className="h-full w-full overflow-y-auto">
        <ScrollArea className="overflow-hidden h-full">
          <ScrollViewport className="h-full max-h-[calc(100vh-100px)] w-full overflow-y-auto rounded-[inherit]">
            <RecordProvider record={record} role={role}>
              <RecordAttributes />
            </RecordProvider>
            <Separator className="my-4 w-full" />
            <Document node={record} canEdit={canEdit} autoFocus={false} />
          </ScrollViewport>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </RecordDatabase>
  );
};
