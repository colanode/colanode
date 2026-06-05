export type LocalSyncTriggerMutationInput = {
    type: 'local.sync.trigger';
    userId: string;
};

export type LocalSyncTriggerMutationOutput = {
    success: boolean;
};

declare module '@colanode/client/mutations' {
    interface MutationMap {
        'local.sync.trigger': {
            input: LocalSyncTriggerMutationInput;
            output: LocalSyncTriggerMutationOutput;
        };
    }
}
