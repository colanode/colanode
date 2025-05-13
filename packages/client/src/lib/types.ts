import { CommandInput, CommandMap } from '../commands';
import { MutationInput, MutationMap } from '../mutations';
import { QueryInput, QueryMap } from '../queries';
import { Event } from '../types/events';

export interface MutationHandler<T extends MutationInput> {
  handleMutation: (input: T) => Promise<MutationMap[T['type']]['output']>;
}

export interface CommandHandler<T extends CommandInput> {
  handleCommand: (input: T) => Promise<CommandMap[T['type']]['output']>;
}

export interface QueryHandler<T extends QueryInput> {
  handleQuery: (input: T) => Promise<QueryMap[T['type']]['output']>;
  checkForChanges: (
    event: Event,
    input: T,
    output: QueryMap[T['type']]['output']
  ) => Promise<ChangeCheckResult<T>>;
}

export type SubscribedQuery<T extends QueryInput> = {
  input: T;
  result: QueryMap[T['type']]['output'];
};

export type ChangeCheckResult<T extends QueryInput> = {
  hasChanges: boolean;
  result?: QueryMap[T['type']]['output'];
};
