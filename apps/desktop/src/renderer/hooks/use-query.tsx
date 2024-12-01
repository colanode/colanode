import {
  useQuery as useTanstackQuery,
  UseQueryOptions as TanstackUseQueryOptions,
} from '@tanstack/react-query';
import { sha256 } from 'js-sha256';

import { QueryInput, QueryMap } from '@/shared/queries';

type UseQueryOptions<T extends QueryInput> = Omit<
  TanstackUseQueryOptions<QueryMap[T['type']]['output']>,
  'queryFn' | 'queryKey'
>;

export const useQuery = <T extends QueryInput>(
  input: T,
  options?: UseQueryOptions<T>
) => {
  const inputJson = JSON.stringify(input);
  const hash = sha256(inputJson);

  const { data, isPending } = useTanstackQuery({
    queryKey: [hash],
    queryFn: () => window.colanode.executeQueryAndSubscribe(hash, input),
    ...options,
  });

  return {
    isPending,
    data,
  };
};
