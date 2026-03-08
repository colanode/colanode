import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { sha256 } from 'js-sha256';

import { eventBus } from '@colanode/client/lib';
import { Event } from '@colanode/client/types';
import { NodeListQueryInput } from '@colanode/client/queries/nodes/node-list';
import { LocalNode } from '@colanode/client/types/nodes';

import { useQuery } from '@colanode/mobile/hooks/use-query';

const getFieldName = (field: Array<string | number>): string => {
  return field.length > 0 ? String(field[0]) : '';
};

export const useNodeListQuery = (
  userId: string,
  filters: NodeListQueryInput['filters'],
  sorts: NodeListQueryInput['sorts'],
  limit?: number
) => {
  const queryClient = useQueryClient();

  const input: NodeListQueryInput = useMemo(
    () => ({
      type: 'node.list' as const,
      userId,
      filters,
      sorts,
      limit,
    }),
    [userId, JSON.stringify(filters), JSON.stringify(sorts), limit]
  );

  const key = useMemo(() => sha256(JSON.stringify(input)), [input]);

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
      const isRelevant = filters.every((filter) => {
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
      });

      if (isRelevant) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    });

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [key, queryClient, filters]);

  return useQuery(input);
};
