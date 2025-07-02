import { EventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import { TempFile } from '@colanode/client/types';

interface SaveDialogOptions {
  name: string;
}

export interface ColanodeWindowApi {
  init: () => Promise<void>;
  executeMutation: <T extends MutationInput>(
    input: T
  ) => Promise<MutationResult<T>>;
  executeQuery: <T extends QueryInput>(
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;
  executeQueryAndSubscribe: <T extends QueryInput>(
    key: string,
    input: T
  ) => Promise<QueryMap[T['type']]['output']>;
  unsubscribeQuery: (key: string) => Promise<void>;
  saveTempFile: (file: File) => Promise<TempFile>;
  openExternalUrl: (url: string) => Promise<void>;
  showItemInFolder: (path: string) => Promise<void>;
  showFileSaveDialog: (
    options: SaveDialogOptions
  ) => Promise<string | undefined>;
}

declare global {
  interface Window {
    colanode: ColanodeWindowApi;
    eventBus: EventBus;
  }
}
