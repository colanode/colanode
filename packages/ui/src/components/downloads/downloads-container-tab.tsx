import { Download } from 'lucide-react';

import { SaveStatus } from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const DownloadsContainerTab = () => {
  const workspace = useWorkspace();

  const fileSaveListQuery = useLiveQuery({
    type: 'file.save.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (fileSaveListQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const activeSaves =
    fileSaveListQuery.data?.filter((save) => save.status === SaveStatus.Active)
      ?.length ?? 0;

  return (
    <div className="flex items-center space-x-2">
      <Download className="size-5" />
      <span>Downloads {activeSaves > 0 ? `(${activeSaves})` : ''}</span>
    </div>
  );
};
