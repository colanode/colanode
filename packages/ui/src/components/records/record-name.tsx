import { useEffect, useRef } from 'react';

import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

export const RecordName = () => {
  const workspace = useWorkspace();
  const record = useRecord();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!record.canEdit) return;

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [record.canEdit, inputRef]);

  return (
    <SmartTextInput
      value={record.name}
      readOnly={!record.canEdit}
      ref={inputRef}
      onChange={(value) => {
        if (value === record.name) {
          return;
        }

        const nodes = appDatabase.workspace(workspace.userId).nodes;
        if (!nodes.has(record.id)) {
          return;
        }

        nodes.update(record.id, (draft) => {
          if (draft.attributes.type !== 'record') {
            return;
          }

          draft.attributes.name = value;
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
