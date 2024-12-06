import {
  generateId,
  IdType,
  LoginOutput,
  WorkspaceOutput,
  WorkspaceRole,
} from '@colanode/core';

import { SelectAccount } from '@/data/schema';
import { database } from '@/data/database';
import { workspaceService } from '@/services/workspace-service';
import { generateToken } from '@/lib/tokens';

class AccountService {
  public async buildLoginOutput(account: SelectAccount): Promise<LoginOutput> {
    const workspaceUsers = await database
      .selectFrom('workspace_users')
      .where('account_id', '=', account.id)
      .selectAll()
      .execute();

    const workspaceOutputs: WorkspaceOutput[] = [];
    if (workspaceUsers.length > 0) {
      const workspaceIds = workspaceUsers.map((wu) => wu.workspace_id);
      const workspaces = await database
        .selectFrom('workspaces')
        .where('id', 'in', workspaceIds)
        .selectAll()
        .execute();

      for (const workspaceUser of workspaceUsers) {
        const workspace = workspaces.find(
          (w) => w.id === workspaceUser.workspace_id
        );

        if (!workspace) {
          continue;
        }

        workspaceOutputs.push({
          id: workspace.id,
          name: workspace.name,
          versionId: workspaceUser.version_id,
          avatar: workspace.avatar,
          description: workspace.description,
          user: {
            id: workspaceUser.id,
            accountId: workspaceUser.account_id,
            role: workspaceUser.role as WorkspaceRole,
          },
        });
      }
    }

    if (workspaceOutputs.length === 0) {
      const workspace = await workspaceService.createDefaultWorkspace(account);
      workspaceOutputs.push(workspace);
    }

    const deviceId = generateId(IdType.Device);
    const { token, salt, hash } = generateToken(deviceId);

    const device = await database
      .insertInto('devices')
      .values({
        id: deviceId,
        account_id: account.id,
        token_hash: hash,
        token_salt: salt,
        token_generated_at: new Date(),
        type: 1,
        created_at: new Date(),
        version: '0.1.0',
      })
      .returningAll()
      .executeTakeFirst();

    if (!device) {
      throw new Error('Failed to create device.');
    }

    return {
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
      },
      workspaces: workspaceOutputs,
      deviceId: device.id,
      token,
    };
  }
}

export const accountService = new AccountService();
