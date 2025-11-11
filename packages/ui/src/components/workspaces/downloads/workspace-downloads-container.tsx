import { useLiveQuery } from '@tanstack/react-db';

import { collections } from '@colanode/ui/collections';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceDownloadFile } from '@colanode/ui/components/workspaces/downloads/workspace-download-file';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceDownloadsContainer = () => {
  const workspace = useWorkspace();

  const downloadsQuery = useLiveQuery((q) =>
    q
      .from({ downloads: collections.workspace(workspace.userId).downloads })
      .select(({ downloads }) => downloads)
      .orderBy(({ downloads }) => downloads.id, 'desc')
  );

  const downloads = downloadsQuery.data ?? [];

  return (
    <div className="overflow-y-auto">
      <div className="max-w-4xl space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Downloads</h2>
          <Separator className="mt-3" />
        </div>
        <div className="space-y-4 w-full">
          {downloads.map((download) => (
            <WorkspaceDownloadFile key={download.id} download={download} />
          ))}
        </div>
      </div>
    </div>
  );
};
