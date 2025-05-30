import { MessageCircle } from 'lucide-react';

interface MessageContainerTabProps {
  messageId: string;
}

export const MessageContainerTab = ({
  messageId,
}: MessageContainerTabProps) => {
  return (
    <div className="flex items-center space-x-2" id={messageId}>
      <MessageCircle className="size-4" />
      <span>Message</span>
    </div>
  );
};
