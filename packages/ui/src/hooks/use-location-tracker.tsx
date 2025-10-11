import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { database } from '@colanode/ui/data';
import { buildMetadataKey } from '@colanode/ui/data/metadata';

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
      const currentLocation = database.metadata.get(metadataKey);
      if (currentLocation) {
        database.metadata.update(metadataKey, (metadata) => {
          metadata.value = location;
          metadata.updatedAt = new Date().toISOString();
        });
      } else {
        database.metadata.insert({
          namespace: userId,
          key: 'location',
          value: location,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        });
      }
    });
  }, [userId, router]);
};
