import { RadarContext } from '@colanode/ui/contexts/radar';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface RadarProviderProps {
  children: React.ReactNode;
}

export const RadarProvider = ({ children }: RadarProviderProps) => {
  const radarDataQuery = useQuery({
    type: 'radar.data.get',
  });

  const radarData = radarDataQuery.data ?? {};
  return (
    <RadarContext.Provider
      value={{
        getAccountState: (accountId) => {
          const accountState = radarData[accountId];
          if (!accountState) {
            return {
              hasUnread: false,
              unreadCount: 0,
            };
          }

          const hasUnread = Object.values(accountState).some(
            (state) => state.state.hasUnread
          );

          const unreadCount = Object.values(accountState).reduce(
            (acc, state) => acc + state.state.unreadCount,
            0
          );

          return {
            hasUnread,
            unreadCount,
          };
        },
        getWorkspaceState: (accountId, workspaceId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
          if (workspaceState) {
            return workspaceState;
          }

          return {
            userId: '',
            workspaceId: workspaceId,
            accountId: accountId,
            state: {
              hasUnread: false,
              unreadCount: 0,
            },
            nodeStates: {},
          };
        },
        getNodeState: (accountId, workspaceId, nodeId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
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
        markNodeAsSeen: (accountId, workspaceId, nodeId) => {
          window.colanode.executeMutation({
            type: 'node.interaction.seen',
            nodeId,
            accountId,
            workspaceId,
          });
        },
        markNodeAsOpened: (accountId, workspaceId, nodeId) => {
          window.colanode.executeMutation({
            type: 'node.interaction.opened',
            nodeId,
            accountId,
            workspaceId,
          });
        },
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};
