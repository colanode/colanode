import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const upsertMetadata = (namespace: string, key: string, value: unknown) => {
  const metadataKey = buildMetadataKey(namespace, key);
  const currentMetadata = collections.metadata.get(metadataKey);
  if (currentMetadata) {
    collections.metadata.update(metadataKey, (metadata) => {
      metadata.value = JSON.stringify(value);
    });
  } else {
    collections.metadata.insert({
      namespace,
      key,
      value: JSON.stringify(value),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    });
  }
};

export const WorkspaceLocationTracker = () => {
  const router = useRouter();
  const workspace = useWorkspace();

  useEffect(() => {
    router.subscribe('onLoad', (event) => {
      if (!event.hrefChanged) {
        return;
      }

      const location = event.toLocation.href;
      if (!location.includes(`/workspace/${workspace.userId}/`)) {
        return;
      }

      upsertMetadata(workspace.userId, 'location', location);
    });
  }, [workspace.userId, router]);

  useEffect(() => {
    upsertMetadata('app', 'workspace', workspace.userId);
    upsertMetadata(workspace.accountId, 'workspace', workspace.userId);
  }, [workspace.userId, workspace.accountId]);

  return null;
};
