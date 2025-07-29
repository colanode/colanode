import { Check, Clock, X } from 'lucide-react';

import { DownloadStatus } from '@colanode/client/types';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';

interface WorkspaceDownloadStatusProps {
  status: DownloadStatus;
  progress: number;
}

export const WorkspaceDownloadStatus = ({
  status,
  progress,
}: WorkspaceDownloadStatusProps) => {
  switch (status) {
    case DownloadStatus.Pending:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center justify-center p-1">
              <Clock className="size-5 text-muted-foreground animate-pulse" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Waiting to download...
          </TooltipContent>
        </Tooltip>
      );
    case DownloadStatus.Downloading:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center justify-center p-1">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Downloading ... {progress}%
          </TooltipContent>
        </Tooltip>
      );
    case DownloadStatus.Completed:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="bg-green-500 rounded-full p-1 flex items-center justify-center">
              <Check className="size-4 text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Downloaded
          </TooltipContent>
        </Tooltip>
      );
    case DownloadStatus.Failed:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="bg-red-500 rounded-full p-1 flex items-center justify-center">
              <X className="size-4 text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Download failed
          </TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
};
