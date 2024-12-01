import React from 'react';

import { RecordAvatar } from '@/renderer/components/records/record-avatar';
import { RecordField } from '@/renderer/components/records/record-field';
import { RecordFieldValue } from '@/renderer/components/records/record-field-value';
import { RecordName } from '@/renderer/components/records/record-name';
import { useDatabase } from '@/renderer/contexts/database';

export const RecordAttributes = () => {
  const database = useDatabase();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <RecordAvatar />
        <RecordName />
      </div>
      <div className="flex flex-col gap-2">
        {database.fields
          .sort((a, b) => a.index.localeCompare(b.index))
          .map((field) => (
            <React.Fragment key={field.id}>
              <div className="flex flex-row gap-2 h-8">
                <div className="w-60 max-w-60">
                  <RecordField field={field} />
                </div>
                <div className="flex-1 max-w-128 p-1">
                  <RecordFieldValue field={field} />
                </div>
              </div>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};
