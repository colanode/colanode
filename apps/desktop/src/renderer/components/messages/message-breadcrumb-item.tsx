import { MessageNode } from '@colanode/core';
import { MessageCircleMore } from 'lucide-react';

interface MessageBreadcrumbItemProps {
  node: MessageNode;
}

export const MessageBreadcrumbItem = ({ node }: MessageBreadcrumbItemProps) => {
  return (
    <div key={node.id} className="flex items-center space-x-2">
      <MessageCircleMore className="size-5" />
      <span>Message</span>
    </div>
  );
};
