import { useLocalSearchParams, useRouter } from 'expo-router';

import { LocalChannelNode } from '@colanode/client/types/nodes';
import { hasNodeRole } from '@colanode/core';
import { ConversationScreen } from '@colanode/mobile/components/conversation/conversation-screen';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';
import { useNodeRole } from '@colanode/mobile/hooks/use-node-role';

export default function ChannelScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { userId } = useWorkspace();

  const { data: channel } = useNodeQuery<LocalChannelNode>(userId, channelId, 'channel');
  const nodeRole = useNodeRole(userId, channel?.rootId);
  const canRename = nodeRole !== null && hasNodeRole(nodeRole, 'editor');

  return (
    <ConversationScreen
      nodeId={channelId!}
      rootId={channel?.rootId}
      title={`# ${channel?.name ?? 'Channel'}`}
      onGoBack={() => router.back()}
      renamableNode={canRename ? channel : undefined}
    />
  );
}
