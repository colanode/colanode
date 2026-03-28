import {
  useQuery as useTanstackQuery,
  UseQueryOptions as TanstackUseQueryOptions,
} from '@tanstack/react-query';

import { QueryInput, QueryMap, buildQueryKey } from '@colanode/client/queries';
import { getColanode } from '@colanode/ui/lib/core-api';

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
    queryFn: () => getColanode().executeQueryAndSubscribe(key, input),
    ...options,
  });

  return result;
};
