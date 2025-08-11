import {
  WorkspaceMetadataKey,
  WorkspaceMetadataMap,
  Workspace as WorkspaceType,
} from '@colanode/client/types';
import { Layout } from '@colanode/ui/components/layouts/layout';
import { useAccount } from '@colanode/ui/contexts/account';
import { WorkspaceContext } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface WorkspaceProps {
  workspace: WorkspaceType;
}

export const Workspace = ({ workspace }: WorkspaceProps) => {
  const account = useAccount();

  const workspaceMetadataListQuery = useLiveQuery({
    type: 'workspace.metadata.list',
    accountId: account.id,
    workspaceId: workspace.id,
  });

  if (workspaceMetadataListQuery.isPending) {
    return null;
  }

  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        getMetadata<K extends WorkspaceMetadataKey>(key: K) {
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
        setMetadata<K extends WorkspaceMetadataKey>(
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
        deleteMetadata(key: string) {
          window.colanode.executeMutation({
            type: 'workspace.metadata.delete',
            accountId: account.id,
            workspaceId: workspace.id,
            key,
          });
        },
      }}
    >
      <Layout key={workspace.id} />
    </WorkspaceContext.Provider>
  );
};
