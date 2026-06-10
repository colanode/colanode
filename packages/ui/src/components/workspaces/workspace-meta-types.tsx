import { eq, useLiveQuery } from '@tanstack/react-db';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { LocalDatabaseNode } from '@colanode/client/types';
import { DEFAULT_PAGE_META_TYPE_NAME } from '@colanode/core';
import { MetaTypeCreateDialog } from '@colanode/ui/components/workspaces/meta-type-create-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface WorkspaceMetaTypesProps {
  userId: string;
  canEdit: boolean;
}

export const WorkspaceMetaTypes = ({ userId, canEdit }: WorkspaceMetaTypesProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const metaTypesQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.type, 'database'))
        .select(({ nodes }) => nodes),
    [userId]
  );

  const metaTypes = (metaTypesQuery.data ?? [])
    .filter((node) => node.type === 'database')
    .map((node) => node as unknown as LocalDatabaseNode)
    .filter((node) => (node.purpose ?? 'records') === 'meta_type');

  return (
    <div className="space-y-4">
      {metaTypes.length > 0 ? (
        <div className="flex flex-col gap-2">
          {metaTypes.map((metaType) => (
            <button
              key={metaType.id}
              type="button"
              onClick={() =>
                navigate({
                  to: '/workspace/$userId/$nodeId',
                  params: { userId, nodeId: metaType.id },
                })
              }
              className="flex items-center justify-between rounded-md border px-3 py-2 text-left hover:bg-muted"
            >
              <span className="font-medium">{metaType.name}</span>
              <span className="text-xs text-muted-foreground">
                {Object.keys(metaType.fields).length} fields
                {metaType.name === DEFAULT_PAGE_META_TYPE_NAME ? ' · default' : ''}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No meta types defined.</p>
      )}

      {canEdit && (
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Create meta type
          </Button>
          <MetaTypeCreateDialog open={open} onOpenChange={setOpen} />
        </>
      )}
    </div>
  );
};
