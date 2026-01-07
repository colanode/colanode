import { LocalChannelNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface ChannelTabProps {
  channel: LocalChannelNode;
}

export const ChannelTab = ({ channel }: ChannelTabProps) => {
  const name =
    channel.name && channel.name.length > 0 ? channel.name : 'Unnamed';

  return <Tab id={channel.id} avatar={channel.avatar} name={name} />;
};
