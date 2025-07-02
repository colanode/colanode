import { Download } from 'lucide-react';

import { FileState } from '@colanode/client/types';
import { Spinner } from '@colanode/ui/components/ui/spinner';

interface FileDownloadProgressProps {
  state: FileState | null | undefined;
}

export const FileDownloadProgress = ({ state }: FileDownloadProgressProps) => {
  const progress = state?.downloadProgress || 0;
  const showProgress = progress > 0;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="relative">
          <Spinner className="size-20 text-muted-foreground stroke-1" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Download className="size-6 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Downloading file
          </p>
          {showProgress && (
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(progress)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
