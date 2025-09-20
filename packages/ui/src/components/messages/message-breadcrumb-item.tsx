import { MessageCircle } from 'lucide-react';

import { LocalMessageNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb-item';

interface MessageBreadcrumbItemProps {
  message: LocalMessageNode;
}

export const MessageBreadcrumbItem = ({
  message: _,
}: MessageBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => <MessageCircle className={className} />}
      name="Message"
    />
  );
};
