import { eq, useLiveQuery } from '@tanstack/react-db';
import { BadgeAlert } from 'lucide-react';

import { Upload, LocalFileNode } from '@colanode/client/types';
import { formatBytes, timeAgo } from '@colanode/core';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { Link } from '@colanode/ui/components/ui/link';
import { WorkspaceUploadStatus } from '@colanode/ui/components/workspaces/uploads/workspace-upload-status';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface WorkspaceUploadFileProps {
  upload: Upload;
}

export const WorkspaceUploadFile = ({ upload }: WorkspaceUploadFileProps) => {
  const workspace = useWorkspace();

  const fileQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.id, upload.fileId))
        .findOne(),
    [workspace.userId, upload.fileId]
  );

  const file = fileQuery.data as LocalFileNode | undefined;

  if (!file) {
    return (
      <div className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer">
        <BadgeAlert className="size-10 text-muted-foreground" />

        <div className="grow flex flex-col gap-2 justify-center items-start min-w-0">
          <p className="font-medium text-sm truncate w-full">
            File not found or has been deleted
          </p>
          {upload.errorMessage && (
            <p className="text-xs text-red-500">{upload.errorMessage}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 flex items-center justify-center">
            <WorkspaceUploadStatus
              status={upload.status}
              progress={upload.progress}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      from="/workspace/$userId"
      to="$nodeId"
      params={{ nodeId: file.id }}
      className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer"
    >
      <FileThumbnail
        userId={workspace.userId}
        file={file}
        className="size-10 text-muted-foreground"
      />
      <div className="grow flex flex-col gap-2 justify-center items-start min-w-0">
        <p className="font-medium text-sm truncate w-full">{file.name}</p>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{file.mimeType}</span>
          <span>{formatBytes(file.size)}</span>
          {upload.completedAt && (
            <span>{timeAgo(new Date(upload.completedAt))}</span>
          )}
        </p>
        {upload.errorMessage && (
          <p className="text-xs text-red-500">{upload.errorMessage}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-10 flex items-center justify-center">
          <WorkspaceUploadStatus
            status={upload.status}
            progress={upload.progress}
          />
        </div>
      </div>
    </Link>
  );
};
