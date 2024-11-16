import { QueryInput, QueryMap } from '@/shared/queries';
import { QueryHandler, SubscribedQuery } from '@/main/types';
import { queryHandlerMap } from '@/main/queries';
import { eventBus } from '@/shared/lib/event-bus';
import { Event } from '@/shared/types/events';

class QueryService {
  private readonly subscribedQueries: Map<string, SubscribedQuery<QueryInput>> =
    new Map();

  constructor() {
    eventBus.subscribe((event: Event) => {
      this.checkForQueryChanges(event);
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

  private async checkForQueryChanges(event: Event): Promise<void> {
    if (event.type === 'query_result_updated') {
      return;
    }

    for (const [id, query] of this.subscribedQueries) {
      const handler = queryHandlerMap[query.input.type] as QueryHandler<
        typeof query.input
      >;
      const changeCheckResult = await handler.checkForChanges(
        event,
        query.input,
        query.result
      );
      if (changeCheckResult.hasChanges && changeCheckResult.result) {
        const newResult = changeCheckResult.result;
        this.subscribedQueries.set(id, {
          input: query.input,
          result: newResult,
        });

        eventBus.publish({
          type: 'query_result_updated',
          id,
          result: newResult,
        });
      }
    }
  }
}

export const queryService = new QueryService();
