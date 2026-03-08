import {
  useQuery as useTanstackQuery,
  UseQueryOptions as TanstackUseQueryOptions,
} from '@tanstack/react-query';
import { sha256 } from 'js-sha256';

import { QueryInput, QueryMap } from '@colanode/client/queries';

import { useAppService } from '@colanode/mobile/contexts/app-service';

type UseQueryOptions<T extends QueryInput> = Omit<
  TanstackUseQueryOptions<QueryMap[T['type']]['output']>,
  'queryFn' | 'queryKey'
>;

export const useQuery = <T extends QueryInput>(
  input: T,
  options?: UseQueryOptions<T>
) => {
  const { appService } = useAppService();
  const inputJson = JSON.stringify(input);
  const hash = sha256(inputJson);

  return useTanstackQuery({
    queryKey: [hash],
    queryFn: () => appService.mediator.executeQuery(input),
    ...options,
  });
};
