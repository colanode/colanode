import { LocalChannelNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface ChannelTabProps {
  channel: LocalChannelNode;
}

export const ChannelTab = ({ channel }: ChannelTabProps) => {
  const name =
    channel.attributes.name && channel.attributes.name.length > 0
      ? channel.attributes.name
      : 'Unnamed';

  return (
    <Tab
      id={channel.id}
      avatar={channel.attributes.avatar}
      name={name}
    />
  );
};
