import {
  useQuery as useTanstackQuery,
  UseQueryOptions as TanstackUseQueryOptions,
} from '@tanstack/react-query';

import { QueryInput, QueryMap, buildQueryKey } from '@colanode/client/queries';

import { useAppService } from '@colanode/mobile/contexts/app-service';

const MOBILE_WINDOW_ID = 'mobile-window';

type UseLiveQueryOptions<T extends QueryInput> = Omit<
  TanstackUseQueryOptions<QueryMap[T['type']]['output']>,
  'queryFn' | 'queryKey'
>;

export const useLiveQuery = <T extends QueryInput>(
  input: T,
  options?: UseLiveQueryOptions<T>
) => {
  const { appService } = useAppService();
  const key = buildQueryKey(input);

  return useTanstackQuery({
    queryKey: [key],
    queryFn: () =>
      appService.mediator.executeQueryAndSubscribe(
        key,
        MOBILE_WINDOW_ID,
        input
      ),
    ...options,
  });
};
