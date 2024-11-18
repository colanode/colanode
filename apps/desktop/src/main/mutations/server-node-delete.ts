import { databaseService } from '@/main/data/database-service';
import { socketService } from '@/main/services/socket-service';
import { MutationHandler } from '@/main/types';
import {
  ServerNodeDeleteMutationInput,
  ServerNodeDeleteMutationOutput,
} from '@/shared/mutations/server-node-delete';
import { nodeService } from '@/main/services/node-service';

export class ServerNodeDeleteMutationHandler
  implements MutationHandler<ServerNodeDeleteMutationInput>
{
  public async handleMutation(
    input: ServerNodeDeleteMutationInput
  ): Promise<ServerNodeDeleteMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('account_id', '=', input.accountId),
          eb('workspace_id', '=', input.workspaceId),
        ])
      )
      .executeTakeFirst();

    if (!workspace) {
      return {
        success: false,
      };
    }

    const userId = workspace.user_id;
    const deleted = await nodeService.serverDelete(userId, input.id);

    if (deleted) {
      socketService.sendMessage(workspace.account_id, {
        type: 'local_node_delete',
        nodeId: input.id,
        workspaceId: input.workspaceId,
      });
    }

    return {
      success: true,
    };
  }
}
