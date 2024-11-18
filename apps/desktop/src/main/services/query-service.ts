import { QueryInput, QueryMap } from '@/shared/queries';
import { QueryHandler, SubscribedQuery } from '@/main/types';
import { queryHandlerMap } from '@/main/queries';
import { eventBus } from '@/shared/lib/event-bus';
import { Event } from '@/shared/types/events';
import { isEqual } from 'lodash-es';

class QueryService {
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
    const handler = queryHandlerMap[input.type] as unknown as QueryHandler<T>;
    const result = await handler.handleQuery(input);
    return result;
  }

  public async executeQueryAndSubscribe<T extends QueryInput>(
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    if (this.subscribedQueries.has(id)) {
      return this.subscribedQueries.get(id)!.result;
    }

    const handler = queryHandlerMap[input.type] as unknown as QueryHandler<T>;
    const result = await handler.handleQuery(input);
    this.subscribedQueries.set(id, {
      input,
      result,
    });
    return result;
  }

  public unsubscribeQuery(id: string) {
    this.subscribedQueries.delete(id);
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

      let result = query.result;
      for (const event of events) {
        const changeCheckResult = await handler.checkForChanges(
          event,
          query.input,
          result
        );

        if (changeCheckResult.hasChanges) {
          result = changeCheckResult.result;
        }
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
