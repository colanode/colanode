import { LocalSyncStatus } from '@colanode/client/types/workspaces';

export type LocalSyncStatusGetQueryInput = {
    type: 'local.sync.status.get';
    userId: string;
};

declare module '@colanode/client/queries' {
    interface QueryMap {
        'local.sync.status.get': {
            input: LocalSyncStatusGetQueryInput;
            output: LocalSyncStatus | null;
        };
    }
}
