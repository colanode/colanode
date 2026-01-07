import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { useEffect, useRef } from 'react';

import { LocalNode } from '@colanode/client/types';
import { Input } from '@colanode/ui/components/ui/input';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

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

  const mutate = usePacedMutations<string, LocalNode>({
    onMutate: (value) => {
      workspace.collections.nodes.update(record.id, (draft) => {
        if (draft.type !== 'record') {
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
    <Input
      value={record.name}
      readOnly={!record.canEdit}
      ref={inputRef}
      onChange={(event) => {
        const newValue = event.target.value;
        mutate(newValue);
      }}
      className="font-heading border-b border-none pl-1 md:text-4xl text-2xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
