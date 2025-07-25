import { useQueries as useTanstackQueries } from '@tanstack/react-query';
import { sha256 } from 'js-sha256';

import { QueryInput } from '@colanode/client/queries';

export const useLiveQueries = <T extends QueryInput>(inputs: T[]) => {
  const result = useTanstackQueries({
    queries: inputs.map((input) => {
      const hash = sha256(JSON.stringify(input));
      return {
        queryKey: [hash],
        queryFn: () => window.colanode.executeQueryAndSubscribe(hash, input),
      };
    }),
  });

  return result;
};
