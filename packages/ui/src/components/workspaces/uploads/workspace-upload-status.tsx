import { Check, X } from 'lucide-react';

import { UploadStatus } from '@colanode/client/types';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';

interface WorkspaceUploadStatusProps {
  status: UploadStatus;
  progress: number;
}

export const WorkspaceUploadStatus = ({
  status,
  progress,
}: WorkspaceUploadStatusProps) => {
  switch (status) {
    case UploadStatus.Pending:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center justify-center p-1">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Uploading ... {progress}%
          </TooltipContent>
        </Tooltip>
      );
    case UploadStatus.Completed:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="bg-green-500 rounded-full p-1 flex items-center justify-center">
              <Check className="size-4 text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Uploaded
          </TooltipContent>
        </Tooltip>
      );
    case UploadStatus.Failed:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="bg-red-500 rounded-full p-1 flex items-center justify-center">
              <X className="size-4 text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Upload failed
          </TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
};
