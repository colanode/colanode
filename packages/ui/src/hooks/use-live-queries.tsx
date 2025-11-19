import { useQueries as useTanstackQueries } from '@tanstack/react-query';

import { QueryInput, buildQueryKey } from '@colanode/client/queries';

export const useLiveQueries = <T extends QueryInput>(inputs: T[]) => {
  const result = useTanstackQueries({
    queries: inputs.map((input) => {
      const key = buildQueryKey(input);
      return {
        queryKey: [key],
        queryFn: () => window.colanode.executeQueryAndSubscribe(key, input),
      };
    }),
  });

  return result;
};
