import { MessageNode, UserNode } from '@colanode/core';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { formatDate, timeAgo } from '@/shared/lib/utils';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface MessageHeaderProps {
  message: MessageNode;
}

export const MessageHeader = ({ message }: MessageHeaderProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'node_get',
    nodeId: message.createdBy,
    userId: workspace.userId,
  });

  if (!data || data.type !== 'user') {
    return null;
  }

  const author = data as UserNode;

  return (
    <div className="font-medium">
      <span>{author.attributes.name}</span>
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
    </div>
  );
};
