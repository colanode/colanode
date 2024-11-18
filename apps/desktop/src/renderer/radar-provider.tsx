import { RadarContext } from '@/renderer/contexts/radar';
import { useQuery } from '@/renderer/hooks/use-query';

interface RadarProviderProps {
  children: React.ReactNode;
}

export const RadarProvider = ({ children }: RadarProviderProps) => {
  const { data } = useQuery({
    type: 'radar_data_get',
  });

  const radarData = data ?? {};
  return (
    <RadarContext.Provider
      value={{
        getAccountState: (accountId) => {
          const workspaceStates = Object.values(radarData).filter(
            (state) => state.accountId === accountId
          );

          const importantCount = workspaceStates.reduce(
            (acc, state) => acc + state.importantCount,
            0
          );

          const hasUnseenChanges = workspaceStates.some(
            (state) => state.hasUnseenChanges
          );

          return {
            importantCount,
            hasUnseenChanges,
          };
        },
        getWorkspaceState: (userId) => {
          const workspaceState = radarData[userId];
          if (workspaceState) {
            return {
              hasUnseenChanges: workspaceState.hasUnseenChanges,
              importantCount: workspaceState.importantCount,
            };
          }

          return {
            nodeStates: {},
            importantCount: 0,
            hasUnseenChanges: false,
          };
        },
        getChatState: (userId, nodeId) => {
          const workspaceState = radarData[userId];
          if (workspaceState) {
            const chatState = workspaceState.nodeStates[nodeId];
            if (chatState && chatState.type === 'chat') {
              return chatState;
            }
          }

          return {
            type: 'chat',
            nodeId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        getChannelState: (userId, nodeId) => {
          const workspaceState = radarData[userId];
          if (workspaceState) {
            const channelState = workspaceState.nodeStates[nodeId];
            if (channelState && channelState.type === 'channel') {
              return channelState;
            }
          }

          return {
            type: 'channel',
            nodeId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        markAsSeen: (userId, nodeId, versionId) => {
          window.colanode.executeMutation({
            type: 'mark_node_as_seen',
            nodeId,
            versionId,
            userId,
          });
        },
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};
