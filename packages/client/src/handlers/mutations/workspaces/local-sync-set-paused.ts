import { MutationHandler } from '@colanode/client/lib/types';
import {
    LocalSyncSetPausedMutationInput,
    LocalSyncSetPausedMutationOutput,
} from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';

export class LocalSyncSetPausedMutationHandler
    implements MutationHandler<LocalSyncSetPausedMutationInput> {
    private readonly app: AppService;

    constructor(app: AppService) {
        this.app = app;
    }

    async handleMutation(
        input: LocalSyncSetPausedMutationInput
    ): Promise<LocalSyncSetPausedMutationOutput> {
        const workspaceService = this.app.getWorkspace(input.userId);
        const cloudSync = workspaceService?.cloudSync;
        if (!cloudSync) {
            return { success: false };
        }
        cloudSync.setPaused(input.paused);
        return { success: true };
    }
}
