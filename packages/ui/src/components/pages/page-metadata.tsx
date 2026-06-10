import { Fragment } from 'react';

import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { PageFieldsProvider } from '@colanode/ui/components/pages/page-fields-provider';
import { PageMetaTypePicker } from '@colanode/ui/components/pages/page-meta-type-picker';
import { RecordField } from '@colanode/ui/components/records/record-field';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { RecordDatabase } from '@colanode/ui/components/records/record-database';
import { useDatabase } from '@colanode/ui/contexts/database';

interface PageMetadataProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageMetadata = ({ page, role }: PageMetadataProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <div className="flex flex-col gap-2 border-b pb-3">
      <PageMetaTypePicker page={page} canEdit={canEdit} />
      <RecordDatabase id={page.metaTypeId} role={role}>
        <PageFieldsProvider page={page} role={role}>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Properties
            </div>
            <PageMetadataFields />
          </div>
        </PageFieldsProvider>
      </RecordDatabase>
    </div>
  );
};

const PageMetadataFields = () => {
  const database = useDatabase();

  if (database.fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No properties defined.</p>
    );
  }

  return (
    <>
      {database.fields
        .sort((a, b) => a.index.localeCompare(b.index))
        .map((field) => (
          <Fragment key={field.id}>
            <div className="flex h-8 flex-row gap-2">
              <div className="w-60 max-w-60">
                <RecordField field={field} />
              </div>
              <div className="max-w-lg flex-1 p-1">
                <RecordFieldValue field={field} />
              </div>
            </div>
          </Fragment>
        ))}
    </>
  );
};
