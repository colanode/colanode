import 'react-circular-progressbar/dist/styles.css';
import { Check, X, Clock } from 'lucide-react';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';

import { UploadStatus } from '@colanode/client/types';
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
            <Clock className="text-muted-foreground animate-pulse size-6" />
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Pending upload
          </TooltipContent>
        </Tooltip>
      );
    case UploadStatus.Uploading:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="size-6">
                <CircularProgressbar
                  value={progress}
                  strokeWidth={8}
                  styles={buildStyles({
                    pathColor: 'var(--color-blue-500)',
                  })}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-row items-center gap-2">
            Uploading ... {Math.round(progress)}%
          </TooltipContent>
        </Tooltip>
      );
    case UploadStatus.Completed:
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="bg-green-600 rounded-full p-1 flex items-center justify-center size-6">
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
            <div className="bg-destructive rounded-full p-1 flex items-center justify-center size-6">
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
