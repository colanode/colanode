export type LocalSyncSetPausedMutationInput = {
    type: 'local.sync.set-paused';
    userId: string;
    paused: boolean;
};

export type LocalSyncSetPausedMutationOutput = {
    success: boolean;
};

declare module '@colanode/client/mutations' {
    interface MutationMap {
        'local.sync.set-paused': {
            input: LocalSyncSetPausedMutationInput;
            output: LocalSyncSetPausedMutationOutput;
        };
    }
}
