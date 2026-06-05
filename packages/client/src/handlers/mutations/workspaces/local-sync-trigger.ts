import { MutationHandler } from '@colanode/client/lib/types';
import {
    LocalSyncTriggerMutationInput,
    LocalSyncTriggerMutationOutput,
} from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';

export class LocalSyncTriggerMutationHandler
    implements MutationHandler<LocalSyncTriggerMutationInput> {
    private readonly app: AppService;

    constructor(app: AppService) {
        this.app = app;
    }

    async handleMutation(
        input: LocalSyncTriggerMutationInput
    ): Promise<LocalSyncTriggerMutationOutput> {
        const workspaceService = this.app.getWorkspace(input.userId);
        const cloudSync = workspaceService?.cloudSync;
        if (!cloudSync) {
            return { success: false };
        }
        await cloudSync.triggerSyncNow();
        return { success: true };
    }
}
