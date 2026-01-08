import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';

import { LocalNode } from '@colanode/client/types';
import { FieldAttributes } from '@colanode/core';
import { Input } from '@colanode/ui/components/ui/input';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

interface FieldRenameInputProps {
  field: FieldAttributes;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const mutate = usePacedMutations<string, LocalNode>({
    onMutate: (value) => {
      workspace.collections.nodes.update(database.id, (draft) => {
        if (draft.type !== 'database') {
          return;
        }

        const fieldAttributes = draft.fields[field.id];
        if (!fieldAttributes) {
          return;
        }

        fieldAttributes.name = value;
      });
    },
    mutationFn: async ({ transaction }) => {
      await applyNodeTransaction(workspace.userId, transaction);
    },
    strategy: debounceStrategy({ wait: 500 }),
  });

  return (
    <div className="w-full p-1">
      <Input
        value={field.name}
        readOnly={!database.canEdit || database.isLocked}
        onChange={(event) => {
          const newValue = event.target.value;
          mutate(newValue);
        }}
      />
    </div>
  );
};
