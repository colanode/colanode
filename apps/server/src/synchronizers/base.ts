import { SynchronizerInput, SynchronizerOutputMessage } from '@colanode/core';
import { Event } from '@colanode/server/types/events';
import { ConnectedUser } from '@colanode/server/types/users';

export type SynchronizerStatus = 'pending' | 'fetching';

export abstract class BaseSynchronizer<T extends SynchronizerInput> {
  public readonly id: string;
  public readonly user: ConnectedUser;
  public readonly input: T;
  public readonly cursor: string;

  protected status: SynchronizerStatus = 'pending';

  constructor(id: string, user: ConnectedUser, input: T, cursor: string) {
    this.id = id;
    this.user = user;
    this.input = input;
    this.cursor = cursor;
  }

  public abstract fetchData(): Promise<SynchronizerOutputMessage<T> | null>;
  public abstract fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<T> | null>;
}
