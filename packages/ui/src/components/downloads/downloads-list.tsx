import { Folder } from 'lucide-react';

import { SaveStatus } from '@colanode/client/types';
import { DownloadStatus } from '@colanode/ui/components/downloads/download-status';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const DownloadsList = () => {
  const workspace = useWorkspace();

  const fileSaveListQuery = useLiveQuery({
    type: 'file.save.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const saves = fileSaveListQuery.data || [];

  const handleOpenDirectory = (path: string) => {
    window.colanode.showItemInFolder(path);
  };

  if (saves.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No downloads yet
      </div>
    );
  }

  return (
    <div className="px-10 py-4 max-w-[50rem] flex flex-col gap-4">
      {saves.map((save) => (
        <div
          key={save.id}
          className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6"
        >
          <FileThumbnail
            file={save.file}
            className="size-10 text-muted-foreground"
          />

          <div className="flex-1 flex flex-col gap-1 justify-center items-start">
            <p className="font-medium text-sm truncate">
              {save.file.attributes.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {save.path}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {save.status === SaveStatus.Completed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDirectory(save.path)}
                    className="h-8 w-8 p-0"
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show in folder</TooltipContent>
              </Tooltip>
            )}
            <DownloadStatus status={save.status} progress={save.progress} />
          </div>
        </div>
      ))}
    </div>
  );
};
