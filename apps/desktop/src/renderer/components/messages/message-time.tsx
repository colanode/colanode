import { MessageNode } from '@colanode/core';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { formatDate, timeAgo } from '@/shared/lib/utils';

interface MessageTimeProps {
  message: MessageNode;
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
