import { isEqual } from 'lodash-es';

import {
  buildMutationHandlerMap,
  MutationHandlerMap,
} from '@colanode/client/handlers/mutations';
import {
  buildQueryHandlerMap,
  QueryHandlerMap,
} from '@colanode/client/handlers/queries';
import { eventBus } from '@colanode/client/lib/event-bus';
import {
  MutationHandler,
  QueryHandler,
  SubscribedQuery,
} from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
  MutationInput,
  MutationResult,
} from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';
import { createDebugger } from '@colanode/core';

const debug = createDebugger('desktop:mediator');

export class Mediator {
  private readonly app: AppService;
  private readonly queryHandlerMap: QueryHandlerMap;
  private readonly mutationHandlerMap: MutationHandlerMap;

  private readonly subscribedQueries: Map<string, SubscribedQuery<QueryInput>> =
    new Map();

  private readonly eventsQueue: Event[] = [];
  private isProcessingEvents = false;

  constructor(app: AppService) {
    this.app = app;
    this.queryHandlerMap = buildQueryHandlerMap(app);
    this.mutationHandlerMap = buildMutationHandlerMap(app);

    eventBus.subscribe((event: Event) => {
      if (event.type === 'query.result.updated') {
        return;
      }

      this.eventsQueue.push(event);
      this.processEventsQueue();
    });
  }

  public async executeQuery<T extends QueryInput>(
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    debug(`Executing query: ${input.type}`);

    const handler = this.queryHandlerMap[
      input.type
    ] as unknown as QueryHandler<T>;

    if (!handler) {
      throw new Error(`No handler found for query type: ${input.type}`);
    }

    const result = await handler.handleQuery(input);
    return result;
  }

  public async executeQueryAndSubscribe<T extends QueryInput>(
    key: string,
    windowId: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    debug(`Executing query and subscribing: ${input.type}`);

    const subscribedQuery = this.subscribedQueries.get(key);
    if (subscribedQuery) {
      subscribedQuery.windowIds.add(windowId);
      return subscribedQuery.result;
    }

    const handler = this.queryHandlerMap[
      input.type
    ] as unknown as QueryHandler<T>;
    if (!handler) {
      throw new Error(`No handler found for query type: ${input.type}`);
    }

    const result = await handler.handleQuery(input);
    this.subscribedQueries.set(key, {
      input,
      result,
      windowIds: new Set([windowId]),
    });
    return result;
  }

  public unsubscribeQuery(key: string, windowId: string) {
    debug(`Unsubscribing query: ${key}`);

    const subscribedQuery = this.subscribedQueries.get(key);
    if (!subscribedQuery) {
      return;
    }

    subscribedQuery.windowIds.delete(windowId);
    if (subscribedQuery.windowIds.size === 0) {
      this.subscribedQueries.delete(key);
    }
  }

  public clearSubscriptions() {
    this.subscribedQueries.clear();
  }

  private async processEventsQueue() {
    if (this.isProcessingEvents) {
      return;
    }

    this.isProcessingEvents = true;

    const events = this.eventsQueue.splice(0, this.eventsQueue.length);
    for (const [id, query] of this.subscribedQueries) {
      const handler = this.queryHandlerMap[query.input.type] as QueryHandler<
        typeof query.input
      >;

      type QueryOutput = QueryMap[(typeof query.input)['type']]['output'];
      let result: QueryOutput = query.result;
      let hasChanges = false;
      for (const event of events) {
        const changeCheckResult = await handler.checkForChanges(
          event,
          query.input,
          result
        );

        if (changeCheckResult.hasChanges) {
          result = changeCheckResult.result as QueryOutput;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        continue;
      }

      if (isEqual(result, query.result)) {
        continue;
      }

      this.subscribedQueries.set(id, {
        input: query.input,
        result,
        windowIds: query.windowIds,
      });

      eventBus.publish({
        type: 'query.result.updated',
        id,
        result,
      });
    }

    this.isProcessingEvents = false;
    if (this.eventsQueue.length > 0) {
      this.processEventsQueue();
    }
  }

  public async executeMutation<T extends MutationInput>(
    input: T
  ): Promise<MutationResult<T>> {
    const handler = this.mutationHandlerMap[
      input.type
    ] as unknown as MutationHandler<T>;

    debug(`Executing mutation: ${input.type}`);

    try {
      if (!handler) {
        throw new Error(`No handler found for mutation type: ${input.type}`);
      }

      const output = await handler.handleMutation(input);
      return { success: true, output };
    } catch (error) {
      debug(`Error executing mutation: ${input.type}`, error);
      if (error instanceof MutationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: MutationErrorCode.Unknown,
          message: 'Something went wrong trying to execute the mutation.',
        },
      };
    }
  }
}
