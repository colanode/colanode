import { getIdType, IdType } from '@colanode/core';
import { RadarContext } from '@colanode/ui/contexts/radar';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface RadarProviderProps {
  children: React.ReactNode;
}

export const RadarProvider = ({ children }: RadarProviderProps) => {
  const radarDataQuery = useLiveQuery({
    type: 'radar.data.get',
  });

  const radarData = radarDataQuery.data ?? {};
  return (
    <RadarContext.Provider
      value={{
        getAccountState: (accountId) => {
          const accountWorkspaces = Object.values(radarData).filter(
            (workspace) => workspace.accountId === accountId
          );

          if (!accountWorkspaces.length) {
            return {
              hasUnread: false,
              unreadCount: 0,
            };
          }

          const hasUnread = accountWorkspaces.some(
            (workspace) => workspace.state.hasUnread
          );

          const unreadCount = accountWorkspaces.reduce(
            (acc, workspace) => acc + workspace.state.unreadCount,
            0
          );

          return {
            hasUnread,
            unreadCount,
          };
        },
        getWorkspaceState: (userId) => {
          const workspaceState = radarData[userId];
          if (workspaceState) {
            return workspaceState;
          }

          return {
            userId: userId,
            workspaceId: '',
            accountId: '',
            state: {
              hasUnread: false,
              unreadCount: 0,
            },
            nodeStates: {},
          };
        },
        getNodeState: (userId, nodeId) => {
          const workspaceState = radarData[userId];
          if (workspaceState) {
            const nodeState = workspaceState.nodeStates[nodeId];
            if (nodeState) {
              return nodeState;
            }
          }

          return {
            hasUnread: false,
            unreadCount: 0,
          };
        },
        getChatsState: (userId) => {
          const workspaceState = radarData[userId];
          if (!workspaceState) {
            return {
              hasUnread: false,
              unreadCount: 0,
            };
          }

          const chatStates = Object.entries(workspaceState.nodeStates)
            .filter(([id]) => getIdType(id) === IdType.Chat)
            .map(([_, nodeState]) => nodeState);

          const hasUnread = chatStates.some((state) => state.hasUnread);
          const unreadCount = chatStates.reduce((acc, state) => {
            return acc + state.unreadCount;
          }, 0);

          return {
            hasUnread,
            unreadCount,
          };
        },
        getChannelsState: (userId) => {
          const workspaceState = radarData[userId];
          if (!workspaceState) {
            return {
              hasUnread: false,
              unreadCount: 0,
            };
          }

          const channelStates = Object.entries(workspaceState.nodeStates)
            .filter(([id]) => getIdType(id) === IdType.Channel)
            .map(([_, nodeState]) => nodeState);

          const hasUnread = channelStates.some((state) => state.hasUnread);
          const unreadCount = channelStates.reduce((acc, state) => {
            return acc + state.unreadCount;
          }, 0);

          return {
            hasUnread,
            unreadCount,
          };
        },
        markNodeAsSeen: (userId, nodeId) => {
          window.colanode.executeMutation({
            type: 'node.interaction.seen',
            nodeId,
            userId,
          });
        },
        markNodeAsOpened: (userId, nodeId) => {
          window.colanode.executeMutation({
            type: 'node.interaction.opened',
            nodeId,
            userId,
          });
        },
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};
