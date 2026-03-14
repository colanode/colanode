import { LocalNode } from '@colanode/client/types/nodes';
import { useNodeListQuery } from '@colanode/mobile/hooks/use-node-list-query';

export const useNodeQuery = <T extends LocalNode>(
  userId: string,
  nodeId: string | undefined,
  nodeType: string
) => {
  const result = useNodeListQuery<T>(
    userId,
    [
      { field: ['id'], operator: 'eq', value: nodeId ?? '' },
      { field: ['type'], operator: 'eq', value: nodeType },
    ],
    [],
    1
  );

  return {
    ...result,
    data: result.data?.[0] as T | undefined,
  };
};
