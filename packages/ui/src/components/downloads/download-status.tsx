import { Check, X } from 'lucide-react';

import { SaveStatus } from '@colanode/client/types';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';

interface DownloadStatusProps {
  status: SaveStatus;
  progress: number;
}

export const DownloadStatus = ({ status, progress }: DownloadStatusProps) => {
  switch (status) {
    case SaveStatus.Active:
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
    case SaveStatus.Completed:
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
    case SaveStatus.Failed:
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
