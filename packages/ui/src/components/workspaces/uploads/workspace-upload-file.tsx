import { FileUploadItem } from '@colanode/client/queries';
import { LocalFileNode } from '@colanode/client/types';
import { formatBytes, timeAgo } from '@colanode/core';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

import { WorkspaceUploadStatus } from './workspace-upload-status';

interface WorkspaceUploadFileProps {
  upload: FileUploadItem;
}

export const WorkspaceUploadFile = ({ upload }: WorkspaceUploadFileProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const fileQuery = useLiveQuery({
    type: 'node.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    nodeId: upload.id,
  });

  const file = fileQuery.data as LocalFileNode;

  if (!file) {
    return null;
  }

  return (
    <div
      className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors flex items-center gap-6 cursor-pointer"
      onClick={() => {
        layout.previewLeft(file.id, true);
      }}
    >
      <FileThumbnail file={file} className="size-10 text-muted-foreground" />

      <div className="flex-1 flex flex-col gap-2 justify-center items-start">
        <p className="font-medium text-sm truncate">{file.attributes.name}</p>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{file.attributes.mimeType}</span>
          <span>{formatBytes(file.attributes.size)}</span>
          {upload.completedAt && (
            <span>{timeAgo(new Date(upload.completedAt))}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <WorkspaceUploadStatus
          status={upload.status}
          progress={upload.progress}
        />
      </div>
    </div>
  );
};
