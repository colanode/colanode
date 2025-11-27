import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';

export const useLocationTracker = (userId: string) => {
  const router = useRouter();

  useEffect(() => {
    router.subscribe('onLoad', (event) => {
      if (!event.hrefChanged) {
        return;
      }

      const location = event.toLocation.href;
      if (!location.includes(`/workspace/${userId}/`)) {
        return;
      }

      const metadataKey = buildMetadataKey(userId, 'location');
      const currentLocation = collections.metadata.get(metadataKey);
      if (currentLocation) {
        collections.metadata.update(metadataKey, (metadata) => {
          metadata.value = JSON.stringify(location);
          metadata.updatedAt = new Date().toISOString();
        });
      } else {
        collections.metadata.insert({
          namespace: userId,
          key: 'location',
          value: JSON.stringify(location),
          createdAt: new Date().toISOString(),
          updatedAt: null,
        });
      }
    });
  }, [userId, router]);

  useEffect(() => {
    const metadataKey = buildMetadataKey('app', 'workspace');
    const currentWorkspace = collections.metadata.get(metadataKey);
    if (currentWorkspace) {
      collections.metadata.update(metadataKey, (metadata) => {
        metadata.value = JSON.stringify(userId);
        metadata.updatedAt = new Date().toISOString();
      });
    } else {
      collections.metadata.insert({
        namespace: 'app',
        key: 'workspace',
        value: JSON.stringify(userId),
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
    }
  }, [userId]);
};
