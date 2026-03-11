import { useLocalSearchParams, useRouter } from 'expo-router';

import { LocalChannelNode } from '@colanode/client/types/nodes';
import { ConversationScreen } from '@colanode/mobile/components/conversation/conversation-screen';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';

export default function ChannelScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { userId } = useWorkspace();

  const { data: channel } = useNodeQuery<LocalChannelNode>(userId, channelId, 'channel');

  return (
    <ConversationScreen
      nodeId={channelId!}
      title={`# ${channel?.name ?? 'Channel'}`}
      onGoBack={() => router.back()}
      renamableNode={channel}
    />
  );
}
