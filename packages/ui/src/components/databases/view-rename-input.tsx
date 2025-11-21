import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';

import { LocalNode } from '@colanode/client/types';
import { Input } from '@colanode/ui/components/ui/input';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

interface ViewRenameInputProps {
  id: string;
  name: string;
  readOnly?: boolean;
}

export const ViewRenameInput = ({
  id,
  name,
  readOnly,
}: ViewRenameInputProps) => {
  const workspace = useWorkspace();

  const mutate = usePacedMutations<string, LocalNode>({
    onMutate: (value) => {
      workspace.collections.nodes.update(id, (draft) => {
        if (draft.type !== 'database_view') {
          return;
        }

        draft.name = value;
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
        value={name}
        readOnly={readOnly}
        onChange={(event) => {
          const newValue = event.target.value;
          mutate(newValue);
        }}
      />
    </div>
  );
};
