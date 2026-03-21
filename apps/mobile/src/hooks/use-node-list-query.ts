import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { eventBus } from '@colanode/client/lib';
import { buildQueryKey } from '@colanode/client/queries';
import { NodeListQueryInput } from '@colanode/client/queries/nodes/node-list';
import { Event } from '@colanode/client/types';
import { LocalNode } from '@colanode/client/types/nodes';
import { useQuery } from '@colanode/mobile/hooks/use-query';

const getFieldName = (field: Array<string | number>): string => {
  return field.length > 0 ? String(field[0]) : '';
};

const useStableValue = <T>(value: T): T => {
  const ref = useRef(value);
  const serialized = JSON.stringify(value);
  const prevSerialized = useRef(serialized);

  if (prevSerialized.current !== serialized) {
    ref.current = value;
    prevSerialized.current = serialized;
  }

  return ref.current;
};

export const useNodeListQuery = <T extends LocalNode = LocalNode>(
  userId: string,
  filters: NodeListQueryInput['filters'],
  sorts: NodeListQueryInput['sorts'],
  limit?: number
) => {
  const queryClient = useQueryClient();
  const stableFilters = useStableValue(filters);
  const stableSorts = useStableValue(sorts);

  const input: NodeListQueryInput = useMemo(
    () => ({
      type: 'node.list' as const,
      userId,
      filters: stableFilters,
      sorts: stableSorts,
      limit,
    }),
    [userId, stableFilters, stableSorts, limit]
  );

  const key = useMemo(() => buildQueryKey(input), [input]);

  useEffect(() => {
    const subscriptionId = eventBus.subscribe((event: Event) => {
      if (
        event.type !== 'node.created' &&
        event.type !== 'node.updated' &&
        event.type !== 'node.deleted'
      ) {
        return;
      }

      const node = event.node as LocalNode;

      // Check if every filter matches the event node.
      // If no filters match a specific field, we consider it relevant.
      const isRelevant = stableFilters.every(
        (filter: NodeListQueryInput['filters'][number]) => {
          const field = getFieldName(filter.field);

          if (field === 'parentId' && filter.operator === 'eq') {
            return node.parentId === filter.value;
          }
          if (field === 'type' && filter.operator === 'eq') {
            return node.type === filter.value;
          }
          if (field === 'rootId' && filter.operator === 'eq') {
            return node.rootId === filter.value;
          }
          // For unrecognized fields, assume it could match
          return true;
        }
      );

      if (isRelevant) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    });

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [key, stableFilters, queryClient]);

  return useQuery(input) as ReturnType<typeof useQuery<NodeListQueryInput>> & {
    data: T[] | undefined;
  };
};
