import { QueryInput, QueryMap } from '@/shared/queries';
import { QueryHandler, SubscribedQuery } from '@/main/types';
import { queryHandlerMap } from '@/main/queries';
import { eventBus } from '@/shared/lib/event-bus';
import { Event } from '@/shared/types/events';
import { isEqual } from 'lodash-es';
import { createLogger } from '@/main/logger';

class QueryService {
  private readonly logger = createLogger('query-service');
  private readonly subscribedQueries: Map<string, SubscribedQuery<QueryInput>> =
    new Map();

  private readonly eventsQueue: Event[] = [];
  private isProcessingEvents = false;

  constructor() {
    eventBus.subscribe((event: Event) => {
      if (event.type === 'query_result_updated') {
        return;
      }

      this.eventsQueue.push(event);
      this.processEventsQueue();
    });
  }

  public async executeQuery<T extends QueryInput>(
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    this.logger.trace(`Executing query: ${input.type}`);

    const handler = queryHandlerMap[input.type] as unknown as QueryHandler<T>;

    if (!handler) {
      throw new Error(`No handler found for query type: ${input.type}`);
    }

    const result = await handler.handleQuery(input);
    return result;
  }

  public async executeQueryAndSubscribe<T extends QueryInput>(
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    this.logger.debug(`Executing query and subscribing: ${input.type}`);

    if (this.subscribedQueries.has(id)) {
      return this.subscribedQueries.get(id)!.result;
    }

    const handler = queryHandlerMap[input.type] as unknown as QueryHandler<T>;
    if (!handler) {
      throw new Error(`No handler found for query type: ${input.type}`);
    }

    const result = await handler.handleQuery(input);
    this.subscribedQueries.set(id, {
      input,
      result,
    });
    return result;
  }

  public unsubscribeQuery(id: string) {
    this.logger.debug(`Unsubscribing query: ${id}`);
    this.subscribedQueries.delete(id);
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
      const handler = queryHandlerMap[query.input.type] as QueryHandler<
        typeof query.input
      >;

      let result: any = query.result;
      let hasChanges = false;
      for (const event of events) {
        const changeCheckResult = await handler.checkForChanges(
          event,
          query.input,
          result
        );

        if (changeCheckResult.hasChanges) {
          result = changeCheckResult.result;
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
      });

      eventBus.publish({
        type: 'query_result_updated',
        id,
        result,
      });
    }

    this.isProcessingEvents = false;
    if (this.eventsQueue.length > 0) {
      this.processEventsQueue();
    }
  }
}

export const queryService = new QueryService();
