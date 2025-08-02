import { BadgeAlert } from 'lucide-react';

import { Upload, LocalFileNode } from '@colanode/client/types';
import { formatBytes, timeAgo } from '@colanode/core';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { WorkspaceUploadStatus } from '@colanode/ui/components/workspaces/uploads/workspace-upload-status';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface WorkspaceUploadFileProps {
  upload: Upload;
}

export const WorkspaceUploadFile = ({ upload }: WorkspaceUploadFileProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const fileQuery = useLiveQuery({
    type: 'node.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    nodeId: upload.fileId,
  });

  const file = fileQuery.data as LocalFileNode;

  if (!file) {
    return (
      <div className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer">
        <BadgeAlert className="size-10 text-muted-foreground" />

        <div className="flex-grow flex flex-col gap-2 justify-center items-start min-w-0">
          <p className="font-medium text-sm truncate w-full">
            File not found or has been deleted
          </p>
          {upload.errorMessage && (
            <p className="text-xs text-red-500">{upload.errorMessage}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
    <div
      className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer"
      onClick={() => {
        layout.previewLeft(file.id, true);
      }}
    >
      <FileThumbnail file={file} className="size-10 text-muted-foreground" />

      <div className="flex-grow flex flex-col gap-2 justify-center items-start min-w-0">
        <p className="font-medium text-sm truncate w-full">
          {file.attributes.name}
        </p>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{file.attributes.mimeType}</span>
          <span>{formatBytes(file.attributes.size)}</span>
          {upload.completedAt && (
            <span>{timeAgo(new Date(upload.completedAt))}</span>
          )}
        </p>
        {upload.errorMessage && (
          <p className="text-xs text-red-500">{upload.errorMessage}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-10 flex items-center justify-center">
          <WorkspaceUploadStatus
            status={upload.status}
            progress={upload.progress}
          />
        </div>
      </div>
    </div>
  );
};
