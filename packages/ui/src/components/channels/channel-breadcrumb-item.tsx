import { LocalChannelNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface ChannelBreadcrumbItemProps {
  channel: LocalChannelNode;
}

export const ChannelBreadcrumbItem = ({
  channel,
}: ChannelBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={channel.id}
          name={channel.attributes.name}
          avatar={channel.attributes.avatar}
          className={className}
        />
      )}
      name={channel.attributes.name}
    />
  );
};
