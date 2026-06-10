import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { LocalNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { Input } from '@colanode/ui/components/ui/input';
import { Link } from '@colanode/ui/components/ui/link';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { CollectionRow } from '@colanode/ui/lib/collection-row';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

interface ListViewCollectionRowProps {
  row: CollectionRow;
}

export const ListViewCollectionRow = ({ row }: ListViewCollectionRowProps) => {
  const workspace = useWorkspace();
  const view = useDatabaseView();
  const navigate = useNavigate();

  const name = row.name;
  const hasName = name !== null && name !== '';

  const mutate = usePacedMutations<string, LocalNode>({
    onMutate: (value) => {
      workspace.collections.nodes.update(row.id, (draft) => {
        if (draft.type !== row.nodeType) {
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

  const openNode = () => {
    if (row.nodeType === 'page') {
      navigate({
        to: '/workspace/$userId/$nodeId',
        params: { userId: workspace.userId, nodeId: row.id },
      });
    }
  };

  return (
    <div className="animate-fade-in group flex flex-row items-center gap-3 border-b px-2 py-2 hover:bg-accent">
      <Avatar
        id={row.id}
        name={hasName ? name : 'Unnamed'}
        avatar={row.source.avatar}
        size="small"
      />
      <Input
        value={name ?? ''}
        onChange={(event) => mutate(event.target.value)}
        className="h-7 min-w-0 flex-1 border-none bg-transparent pl-1 shadow-none focus-visible:ring-0"
        placeholder="Unnamed"
      />
      {view.fields.length > 0 && (
        <div className="flex shrink-0 flex-row items-center gap-4">
          {view.fields.map((viewField) => {
            if (!viewField.display) {
              return null;
            }

            return (
              <div
                key={viewField.field.id}
                className="min-w-0 max-w-40 truncate text-sm text-muted-foreground"
              >
                <RecordFieldValue field={viewField.field} readOnly={true} />
              </div>
            );
          })}
        </div>
      )}
      {row.nodeType === 'record' ? (
        <Link
          from="/workspace/$userId/$nodeId"
          to="modal/$modalNodeId"
          params={{ modalNodeId: row.id }}
          className="invisible flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background group-hover:visible"
        >
          <SquareArrowOutUpRight className="size-4" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={openNode}
          className="invisible flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background group-hover:visible"
        >
          <SquareArrowOutUpRight className="size-4" />
        </button>
      )}
    </div>
  );
};
