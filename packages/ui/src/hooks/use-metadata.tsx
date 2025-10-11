import { eq, useLiveQuery } from '@tanstack/react-db';

import { database } from '@colanode/ui/data';
import { buildMetadataKey } from '@colanode/ui/data/metadata';

export const useMetadata = <T = string,>(
  namespace: string,
  key: string
): [T | undefined, (value: T | undefined) => void] => {
  const metadataQuery = useLiveQuery((q) =>
    q
      .from({ metadata: database.metadata })
      .where(
        ({ metadata }) =>
          eq(metadata.namespace, namespace) && eq(metadata.key, key)
      )
      .select(({ metadata }) => ({
        value: metadata.value,
      }))
      .findOne()
  );

  const setValue = (value: T | undefined) => {
    const metadataKey = buildMetadataKey(namespace, key);
    const currentMetadata = database.metadata.get(metadataKey);

    if (value === undefined) {
      if (currentMetadata) {
        database.metadata.delete(metadataKey);
      }
    } else {
      const json = JSON.stringify(value);

      if (currentMetadata) {
        database.metadata.update(metadataKey, (metadata) => {
          metadata.value = json;
          metadata.updatedAt = new Date().toISOString();
        });
      } else {
        const newMetadata = {
          namespace,
          key,
          value: json,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        };

        database.metadata.insert(newMetadata);
      }
    }
  };

  const parsedValue = metadataQuery.data?.value
    ? (JSON.parse(metadataQuery.data.value) as T)
    : undefined;

  return [parsedValue, setValue];
};
