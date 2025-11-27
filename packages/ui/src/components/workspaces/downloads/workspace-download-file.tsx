import { useNavigate } from '@tanstack/react-router';
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
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface WorkspaceDownloadFileProps {
  download: Download;
}

export const WorkspaceDownloadFile = ({
  download,
}: WorkspaceDownloadFileProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });

  const fileQuery = useLiveQuery({
    type: 'node.get',
    userId: workspace.userId,
    nodeId: download.fileId,
  });

  const file = fileQuery.data as LocalFileNode | undefined;

  return (
    <div
      className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer"
      onClick={() => {
        if (file) {
          navigate({
            to: '$nodeId',
            params: { nodeId: file.id },
          });
        }
      }}
    >
      {file ? (
        <FileThumbnail
          userId={workspace.userId}
          file={file}
          className="size-10 text-muted-foreground"
        />
      ) : (
        <FileIcon mimeType={download.mimeType} className="size-10" />
      )}

      <div className="grow flex flex-col gap-2 justify-center items-start min-w-0">
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
              className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-foreground"
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
      <div className="flex items-center gap-2 shrink-0">
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
