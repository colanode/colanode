import { FieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

interface FieldRenameInputProps {
  field: FieldAttributes;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  return (
    <div className="w-full p-1">
      <SmartTextInput
        value={field.name}
        readOnly={!database.canEdit}
        onChange={(newName) => {
          if (newName === field.name) return;
          const nodes = appDatabase.workspace(workspace.userId).nodes;
          if (!nodes.has(database.id)) {
            return;
          }

          nodes.update(database.id, (draft) => {
            if (draft.attributes.type !== 'database') {
              return;
            }

            const fieldDraft = draft.attributes.fields[field.id];
            if (!fieldDraft) {
              return;
            }

            fieldDraft.name = newName;
          });
        }}
      />
    </div>
  );
};
