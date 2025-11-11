import { LocalMessageNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

interface MessageBreadcrumbItemProps {
  message: LocalMessageNode;
}

export const MessageBreadcrumbItem = ({
  message: _,
}: MessageBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem id="message" avatar={defaultIcons.message} name="Message" />
  );
};
