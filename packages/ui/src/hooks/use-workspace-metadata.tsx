import { eq, useLiveQuery } from '@tanstack/react-db';

import {
  WorkspaceMetadataKey,
  WorkspaceMetadataMap,
} from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

export const useWorkspaceMetadata = <K extends WorkspaceMetadataKey>(
  key: K
): WorkspaceMetadataMap[K]['value'] | undefined => {
  const workspace = useWorkspace();

  const metadataQuery = useLiveQuery((q) =>
    q
      .from({
        metadata: database.workspaceMetadata(workspace.accountId, workspace.id),
      })
      .where(({ metadata }) => eq(metadata.key as string, key))
      .select(({ metadata }) => ({
        value: metadata.value,
      }))
  );

  return metadataQuery.data?.[0]?.value as
    | WorkspaceMetadataMap[K]['value']
    | undefined;
};
