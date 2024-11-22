import { MessageNode, SpaceNode } from '@colanode/core';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { MessageCircleMore } from 'lucide-react';

interface MessageBreadcrumbItemProps {
  node: MessageNode;
}

export const MessageBreadcrumbItem = ({ node }: MessageBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <MessageCircleMore className="size-5" />
      <span>Message</span>
    </div>
  );
};
