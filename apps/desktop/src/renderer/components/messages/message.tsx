import { Avatar } from '@/renderer/components/avatars/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';
import { formatDate, timeAgo } from '@/shared/lib/utils';
import { InView } from 'react-intersection-observer';
import { NodeRenderer } from '@/renderer/editor/renderers/node';
import { MessageNode } from '@/shared/types/messages';
import { MessageReactions } from '@/renderer/components/messages/message-reactions';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRadar } from '@/renderer/contexts/radar';
import { MessageActions } from '@/renderer/components/messages/message-actions';

interface MessageProps {
  message: MessageNode;
  previousMessage?: MessageNode | null;
}

const shouldDisplayUserInfo = (
  message: MessageNode,
  previousMessage?: MessageNode | null
) => {
  if (!previousMessage) {
    return true;
  }

  const previousMessageDate = new Date(previousMessage.createdAt);
  const currentMessageDate = new Date(message.createdAt);

  if (previousMessageDate.getDate() !== currentMessageDate.getDate()) {
    return true;
  }

  return previousMessage.author.id !== message.author.id;
};

export const Message = ({ message, previousMessage }: MessageProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  const displayUserInfo = shouldDisplayUserInfo(message, previousMessage);

  return (
    <div
      id={`message-${message.id}`}
      key={`message-${message.id}`}
      className={`group flex flex-row px-1 hover:bg-gray-50 ${
        displayUserInfo ? 'mt-2 first:mt-0' : ''
      }`}
    >
      <div className="mr-2 w-10 pt-1">
        {displayUserInfo && (
          <Avatar
            id={message.author.id}
            name={message.author.name}
            avatar={message.author.avatar}
            size="medium"
          />
        )}
      </div>

      <div className="relative w-full">
        {displayUserInfo && (
          <div className="font-medium">
            <span>{message.author.name}</span>
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
        )}

        <InView
          rootMargin="50px"
          onChange={(inView) => {
            if (inView) {
              radar.markAsSeen(workspace.userId, message.id, message.versionId);
            }
          }}
        >
          <MessageActions message={message} />
          <div className="text-foreground">
            {message.content.map((node) => (
              <NodeRenderer
                key={node.attrs?.id}
                node={node}
                keyPrefix={node.attrs?.id}
              />
            ))}
          </div>
          <MessageReactions message={message} />
        </InView>
      </div>
    </div>
  );
};
