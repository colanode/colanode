import { LocalChannelNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';

interface ChannelBreadcrumbItemProps {
  channel: LocalChannelNode;
}

export const ChannelBreadcrumbItem = ({
  channel,
}: ChannelBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={channel.id}
      avatar={channel.avatar}
      name={channel.name}
    />
  );
};
