import { Download } from 'lucide-react';
import {
  DownloadStatus,
  FileState,
  LocalFileNode,
} from '@colanode/client/types';
import { formatBytes } from '@colanode/core';

import { Spinner } from '@/renderer/components/ui/spinner';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { toast } from '@/renderer/hooks/use-toast';

interface FileDownloadProps {
  file: LocalFileNode;
  state: FileState | null | undefined;
}

export const FileDownload = ({ file, state }: FileDownloadProps) => {
  const workspace = useWorkspace();

  const isDownloading = state?.downloadStatus === DownloadStatus.Pending;

  return (
    <div className="flex h-full w-full items-center justify-center">
      {isDownloading ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="size-8" />
          <p className="text-sm">
            Downloading file ({state?.downloadProgress}%)
          </p>
        </div>
      ) : (
        <div
          className="flex cursor-pointer flex-col items-center gap-3 text-muted-foreground hover:text-primary"
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const result = await window.colanode.executeMutation({
              type: 'file_download',
              accountId: workspace.accountId,
              workspaceId: workspace.id,
              fileId: file.id,
            });

            if (!result.success) {
              toast({
                title: 'Failed to download file',
                description: result.error.message,
                variant: 'destructive',
              });
            }
          }}
        >
          <Download className="size-8" />
          <p className="text-sm">
            File is not downloaded in your device. Click to download.
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.attributes.size)} -{' '}
            {file.attributes.mimeType.split('/')[1]}
          </p>
        </div>
      )}
    </div>
  );
};
