import { MarkFileOpenedMutation, generateId, IdType } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  FileMarkOpenedMutationInput,
  FileMarkOpenedMutationOutput,
} from '@/shared/mutations/files/file-mark-opened';
import { eventBus } from '@/shared/lib/event-bus';
import { mapFileInteraction } from '@/main/lib/mappers';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class FileMarkOpenedMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileMarkOpenedMutationInput>
{
  async handleMutation(
    input: FileMarkOpenedMutationInput
  ): Promise<FileMarkOpenedMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const file = await workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!file) {
      return {
        success: false,
      };
    }

    const existingInteraction = await workspace.database
      .selectFrom('file_interactions')
      .selectAll()
      .where('file_id', '=', input.fileId)
      .where('collaborator_id', '=', workspace.userId)
      .executeTakeFirst();

    if (existingInteraction) {
      const lastOpenedAt = existingInteraction.last_opened_at;
      if (
        lastOpenedAt &&
        lastOpenedAt > new Date(Date.now() - 5 * 60 * 1000).toISOString()
      ) {
        return {
          success: true,
        };
      }
    }

    const lastOpenedAt = new Date().toISOString();
    const firstOpenedAt = existingInteraction
      ? existingInteraction.first_opened_at
      : lastOpenedAt;

    const { createdInteraction, createdMutation } = await workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdInteraction = await trx
          .insertInto('file_interactions')
          .returningAll()
          .values({
            file_id: input.fileId,
            collaborator_id: workspace.userId,
            last_opened_at: lastOpenedAt,
            first_opened_at: firstOpenedAt,
            version: 0n,
            root_id: file.root_id,
          })
          .onConflict((b) =>
            b.columns(['file_id', 'collaborator_id']).doUpdateSet({
              last_opened_at: lastOpenedAt,
              first_opened_at: firstOpenedAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create file interaction');
        }

        const mutation: MarkFileOpenedMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_file_opened',
          data: {
            fileId: input.fileId,
            collaboratorId: workspace.userId,
            openedAt: new Date().toISOString(),
          },
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: mutation.id,
            type: mutation.type,
            data: JSON.stringify(mutation.data),
            created_at: mutation.createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        return {
          createdInteraction,
          createdMutation,
        };
      });

    if (!createdInteraction || !createdMutation) {
      throw new Error('Failed to create file interaction');
    }

    workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'file_interaction_updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      fileInteraction: mapFileInteraction(createdInteraction),
    });

    return {
      success: true,
    };
  }
}
