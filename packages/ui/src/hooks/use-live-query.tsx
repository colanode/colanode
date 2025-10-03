import {
  useQuery as useTanstackQuery,
  UseQueryOptions as TanstackUseQueryOptions,
} from '@tanstack/react-query';

import { QueryInput, QueryMap, buildQueryKey } from '@colanode/client/queries';

type UseLiveQueryOptions<T extends QueryInput> = Omit<
  TanstackUseQueryOptions<QueryMap[T['type']]['output']>,
  'queryFn' | 'queryKey'
>;

export const useLiveQuery = <T extends QueryInput>(
  input: T,
  options?: UseLiveQueryOptions<T>
) => {
  const key = buildQueryKey(input);

  const result = useTanstackQuery({
    queryKey: [key],
    queryFn: () => window.colanode.executeQueryAndSubscribe(key, input),
    ...options,
  });

  return result;
};
