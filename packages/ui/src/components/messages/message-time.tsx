import { LocalMessageNode } from '@colanode/client/types';
import { formatDate, timeAgo } from '@colanode/core';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';

interface MessageTimeProps {
  message: LocalMessageNode;
}

export const MessageTime = ({ message }: MessageTimeProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-2 text-xs text-muted-foreground">
          {timeAgo(message.createdAt)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-sm shadow-md">
          {formatDate(message.createdAt)}
        </span>
      </TooltipContent>
    </Tooltip>
  );
};
