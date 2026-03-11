import { useLocalSearchParams, useRouter } from 'expo-router';

import { LocalChannelNode } from '@colanode/client/types/nodes';
import { ConversationScreen } from '@colanode/mobile/components/conversation/conversation-screen';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export default function ChannelScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { userId } = useWorkspace();

  const { data: channelNodes } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: channelId },
      { field: ['type'], operator: 'eq', value: 'channel' },
    ],
    [],
    1
  );

  const channel = channelNodes?.[0] as LocalChannelNode | undefined;

  return (
    <ConversationScreen
      nodeId={channelId!}
      title={`# ${channel?.name ?? 'Channel'}`}
      onGoBack={() => router.back()}
      renamableNode={channel}
    />
  );
}
