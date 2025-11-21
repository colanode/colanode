import { FieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

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

          const nodes = workspace.collections.nodes;
          nodes.update(database.id, (draft) => {
            if (draft.type !== 'database') {
              return;
            }

            const fieldAttributes = draft.fields[field.id];
            if (!fieldAttributes) {
              return;
            }

            fieldAttributes.name = newName;
          });
        }}
      />
    </div>
  );
};
