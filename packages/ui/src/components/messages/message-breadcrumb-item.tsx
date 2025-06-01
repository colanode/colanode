import { MessageCircle } from 'lucide-react';

import { LocalMessageNode } from '@colanode/client/types';

interface MessageBreadcrumbItemProps {
  message: LocalMessageNode;
}

export const MessageBreadcrumbItem = ({
  message,
}: MessageBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2" id={message.id}>
      <MessageCircle className="size-4" />
      <span>Message</span>
    </div>
  );
};
