import { ChannelNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface ChannelBreadcrumbItemProps {
  node: ChannelNode;
}

export const ChannelBreadcrumbItem = ({ node }: ChannelBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={node.id}
        name={node.attributes.name}
        avatar={node.attributes.avatar}
      />
      <span>{node.attributes.name}</span>
    </div>
  );
};
