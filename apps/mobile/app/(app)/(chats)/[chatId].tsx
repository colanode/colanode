import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { LocalChatNode } from '@colanode/client/types/nodes';
import { ConversationScreen } from '@colanode/mobile/components/conversation/conversation-screen';
import { useWorkspace } from '@colanode/mobile/contexts/workspace';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { userId } = useWorkspace();

  const { data: users } = useLiveQuery({ type: 'user.list', userId });

  const { data: chatNodes } = useNodeListQuery(
    userId,
    [
      { field: ['id'], operator: 'eq', value: chatId },
      { field: ['type'], operator: 'eq', value: 'chat' },
    ],
    [],
    1
  );

  const chat = chatNodes?.[0] as LocalChatNode | undefined;
  const otherUserId = chat
    ? Object.keys(chat.collaborators).find((id) => id !== userId)
    : undefined;
  const otherUser = users?.find((u) => u.id === otherUserId);
  const chatName = otherUser?.name ?? 'Chat';

  const handleGoBack = useCallback(() => {
    // When deep-linked from another tab the stack index may be 0.
    const state = navigation.getState();
    if (state && state.index > 0) {
      router.back();
    } else {
      router.replace('/(app)/(chats)/');
    }
  }, [navigation, router]);

  return (
    <ConversationScreen
      nodeId={chatId!}
      title={chatName}
      onGoBack={handleGoBack}
    />
  );
}
