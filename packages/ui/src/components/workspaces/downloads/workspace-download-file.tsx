import { Folder } from 'lucide-react';

import { LocalFileNode, Download } from '@colanode/client/types';
import { formatBytes, timeAgo } from '@colanode/core';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { WorkspaceDownloadStatus } from '@colanode/ui/components/workspaces/downloads/workspace-download-status';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface WorkspaceDownloadFileProps {
  download: Download;
}

export const WorkspaceDownloadFile = ({
  download,
}: WorkspaceDownloadFileProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const fileQuery = useLiveQuery({
    type: 'node.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    nodeId: download.fileId,
  });

  const file = fileQuery.data as LocalFileNode | undefined;

  return (
    <div
      className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer"
      onClick={() => {
        if (file) {
          layout.previewLeft(file.id, true);
        }
      }}
    >
      {file ? (
        <FileThumbnail file={file} className="size-10 text-muted-foreground" />
      ) : (
        <FileIcon mimeType={download.mimeType} className="size-10" />
      )}

      <div className="flex-grow flex flex-col gap-2 justify-center items-start min-w-0">
        <p className="font-medium text-sm truncate">{download.name}</p>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{download.mimeType}</span>
          <span>{formatBytes(download.size)}</span>
          {download.completedAt && (
            <span>{timeAgo(new Date(download.completedAt))}</span>
          )}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                window.colanode.showItemInFolder(download.path);
              }}
            >
              <Folder className="size-4" />
              <span className="truncate">{download.path}</span>
            </p>
          </TooltipTrigger>
          <TooltipContent>Show in folder</TooltipContent>
        </Tooltip>
        {download.errorMessage && (
          <p className="text-xs text-red-500">{download.errorMessage}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-10 flex items-center justify-center">
          <WorkspaceDownloadStatus
            status={download.status}
            progress={download.progress}
          />
        </div>
      </div>
    </div>
  );
};
