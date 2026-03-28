import type { ReactNode } from 'react';

import type { LocalRecordNode } from '@colanode/client/types';
import type { NodeRole } from '@colanode/core';
import { RecordAttributes } from '@colanode/ui/components/records/record-attributes';
import { RecordDatabase } from '@colanode/ui/components/records/record-database';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { Separator } from '@colanode/ui/components/ui/separator';

interface RecordDetailLayoutProps {
  record: LocalRecordNode;
  role: NodeRole;
  children: ReactNode;
}

export const RecordDetailLayout = ({
  record,
  role,
  children,
}: RecordDetailLayoutProps) => {
  return (
    <RecordDatabase id={record.databaseId} role={role}>
      <RecordProvider record={record} role={role}>
        <RecordAttributes />
      </RecordProvider>
      <Separator className="my-4 w-full" />
      {children}
    </RecordDatabase>
  );
};
