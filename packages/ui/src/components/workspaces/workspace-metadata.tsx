import {
  WorkspaceMetadataKey,
  WorkspaceMetadataMap,
} from '@colanode/client/types';
import { useAccount } from '@colanode/ui/contexts/account';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { WorkspaceMetadataContext } from '@colanode/ui/contexts/workspace-metadata';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface WorkspaceMetadataProps {
  children: React.ReactNode;
}

export const WorkspaceMetadata = ({ children }: WorkspaceMetadataProps) => {
  const account = useAccount();
  const workspace = useWorkspace();

  const workspaceMetadataListQuery = useLiveQuery({
    type: 'workspace.metadata.list',
    accountId: account.id,
    workspaceId: workspace.id,
  });

  return (
    <WorkspaceMetadataContext.Provider
      value={{
        ...workspace,
        get<K extends WorkspaceMetadataKey>(key: K) {
          const value = workspaceMetadataListQuery.data?.find(
            (m) => m.key === key
          );
          if (!value) {
            return undefined;
          }

          if (value.key !== key) {
            return undefined;
          }

          return value as WorkspaceMetadataMap[K];
        },
        set<K extends WorkspaceMetadataKey>(
          key: K,
          value: WorkspaceMetadataMap[K]['value']
        ) {
          window.colanode.executeMutation({
            type: 'workspace.metadata.update',
            accountId: account.id,
            workspaceId: workspace.id,
            key,
            value,
          });
        },
        delete(key: string) {
          window.colanode.executeMutation({
            type: 'workspace.metadata.delete',
            accountId: account.id,
            workspaceId: workspace.id,
            key,
          });
        },
      }}
    >
      {children}
    </WorkspaceMetadataContext.Provider>
  );
};
