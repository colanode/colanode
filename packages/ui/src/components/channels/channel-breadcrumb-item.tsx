import { LocalChannelNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface ChannelBreadcrumbItemProps {
  channel: LocalChannelNode;
}

export const ChannelBreadcrumbItem = ({
  channel,
}: ChannelBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={channel.id}
      avatar={channel.attributes.avatar}
      name={channel.attributes.name}
    />
  );
};
