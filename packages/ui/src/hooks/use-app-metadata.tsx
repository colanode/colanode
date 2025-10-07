import { eq, useLiveQuery } from '@tanstack/react-db';

import { AppMetadataKey, AppMetadataMap } from '@colanode/client/types';
import { database } from '@colanode/ui/data';

export const useAppMetadata = <K extends AppMetadataKey>(
  key: K
): AppMetadataMap[K]['value'] | undefined => {
  const metadataQuery = useLiveQuery((q) =>
    q
      .from({ metadata: database.metadata })
      .where(({ metadata }) => eq(metadata.key as string, key))
      .select(({ metadata }) => ({
        value: metadata.value,
      }))
  );

  return metadataQuery.data?.[0]?.value as
    | AppMetadataMap[K]['value']
    | undefined;
};
