import { createDebugger } from '@colanode/core';
import { isEqual } from 'lodash-es';
import { CommandInput, CommandMap } from '@colanode/client/commands';
import { QueryInput, QueryMap } from '@colanode/client/queries';

import { buildMutationHandlerMap, MutationHandlerMap } from './mutations';
import { buildQueryHandlerMap, QueryHandlerMap } from './queries';
import { buildCommandHandlerMap, CommandHandlerMap } from './commands';

import {
  MutationHandler,
  CommandHandler,
  QueryHandler,
  SubscribedQuery,
} from '../lib/types';
import {
  MutationError,
  MutationErrorCode,
  MutationInput,
  MutationResult,
} from '../mutations';
import { eventBus } from '../lib/event-bus';
import { Event } from '../types/events';
import { AppService } from '../services/app-service';

const debug = createDebugger('desktop:mediator');

export class Mediator {
  private readonly app: AppService;
  private readonly queryHandlerMap: QueryHandlerMap;
  private readonly mutationHandlerMap: MutationHandlerMap;
  private readonly commandHandlerMap: CommandHandlerMap;

  private readonly subscribedQueries: Map<string, SubscribedQuery<QueryInput>> =
    new Map();

  private readonly eventsQueue: Event[] = [];
  private isProcessingEvents = false;

  constructor(app: AppService) {
    this.app = app;
    this.queryHandlerMap = buildQueryHandlerMap(app);
    this.mutationHandlerMap = buildMutationHandlerMap(app);
    this.commandHandlerMap = buildCommandHandlerMap(app);

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
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> {
    debug(`Executing query and subscribing: ${input.type}`);

    if (this.subscribedQueries.has(id)) {
      return this.subscribedQueries.get(id)!.result;
    }

    const handler = this.queryHandlerMap[
      input.type
    ] as unknown as QueryHandler<T>;
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
    debug(`Unsubscribing query: ${id}`);
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

  public async executeCommand<T extends CommandInput>(
    input: T
  ): Promise<CommandMap[T['type']]['output']> {
    debug(`Executing command: ${input.type}`);

    const handler = this.commandHandlerMap[
      input.type
    ] as unknown as CommandHandler<T>;

    if (!handler) {
      throw new Error(`No handler found for command type: ${input.type}`);
    }

    return handler.handleCommand(input);
  }
}
