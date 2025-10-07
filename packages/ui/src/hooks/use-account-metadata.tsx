import { eq, useLiveQuery } from '@tanstack/react-db';

import { AccountMetadataKey, AccountMetadataMap } from '@colanode/client/types';
import { useAccount } from '@colanode/ui/contexts/account';
import { database } from '@colanode/ui/data';

export const useAccountMetadata = <K extends AccountMetadataKey>(
  key: K
): AccountMetadataMap[K]['value'] | undefined => {
  const account = useAccount();

  const metadataQuery = useLiveQuery((q) =>
    q
      .from({ metadata: database.accountMetadata(account.id) })
      .where(({ metadata }) => eq(metadata.key as string, key))
      .select(({ metadata }) => ({
        value: metadata.value,
      }))
  );

  return metadataQuery.data?.[0]?.value as
    | AccountMetadataMap[K]['value']
    | undefined;
};
