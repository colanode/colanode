import { EventBus } from '@colanode/client/lib';
import { MutationInput, MutationResult } from '@colanode/client/mutations';
import { QueryInput, QueryMap } from '@colanode/client/queries';
import type {
  BackupListItem,
  BackupProgress,
} from '@colanode/client/services/backup';
import { AppInitOutput, TempFile } from '@colanode/client/types';

interface SaveDialogOptions {
  name: string;
}

export interface BackupProviderConfig {
  type: 'github' | 's3' | 'local';
  [key: string]: unknown;
}

export interface ColanodeWindowApi {
  init: () => Promise<AppInitOutput>;
  reset: () => Promise<void>;
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
  getStorageDirectory: () => Promise<string | undefined>;
  showStorageDirectoryDialog: () => Promise<string | undefined>;
  setStorageDirectory: (path: string) => Promise<void>;
  backupCreate: (
    config: BackupProviderConfig
  ) => Promise<{ backupId: string }>;
  backupList: (config: BackupProviderConfig) => Promise<BackupListItem[]>;
  backupRestore: (params: {
    config: BackupProviderConfig;
    backupId: string;
    targetPath?: string;
  }) => Promise<void>;
  onBackupProgress: (
    callback: (progress: BackupProgress) => void
  ) => () => void;
}

declare global {
  interface Window {
    colanode: ColanodeWindowApi;
    eventBus: EventBus;
  }
}
