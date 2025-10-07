import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { database } from '@colanode/ui/data';

export const useLocationTracker = (accountId: string, workspaceId: string) => {
  const router = useRouter();

  useEffect(() => {
    router.subscribe('onLoad', (event) => {
      if (!event.hrefChanged) {
        return;
      }

      const location = event.toLocation.href;
      if (!location.includes(`/acc/${accountId}/${workspaceId}`)) {
        return;
      }

      const workspaceMetadata = database.workspaceMetadata(
        accountId,
        workspaceId
      );
      const currentLocation = workspaceMetadata.get('location');
      if (currentLocation) {
        workspaceMetadata.update('location', (metadata) => {
          metadata.value = location;
        });
      } else {
        workspaceMetadata.insert({
          key: 'location',
          value: location,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        });
      }
    });
  }, [accountId, workspaceId, router]);
};
