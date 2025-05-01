import { JobHandler } from '@/types/jobs';
import { database } from '@/data/database';
import { deleteFile } from '@/lib/files';

export type CleanWorkspaceDataInput = {
  type: 'clean_workspace_data';
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    clean_workspace_data: {
      input: CleanWorkspaceDataInput;
    };
  }
}

const BATCH_SIZE = 500;

export const cleanWorkspaceDataHandler: JobHandler<
  CleanWorkspaceDataInput
> = async (input) => {
  try {
    await deleteWorkspaceUsers(input.workspaceId);
    await deleteWorkspaceNodes(input.workspaceId);
    await deleteWorkspaceUploads(input.workspaceId);
  } catch (error) {
    console.error('Error cleaning workspace data:', error);
    throw error;
  }
};

const deleteWorkspaceUsers = async (workspaceId: string) => {
  let hasMore = true;

  while (hasMore) {
    const result = await database
      .deleteFrom('users')
      .returning(['id'])
      .where(
        'id',
        'in',
        database
          .selectFrom('users')
          .select('id')
          .where('workspace_id', '=', workspaceId)
          .limit(BATCH_SIZE)
      )
      .execute();

    if (result.length === 0) {
      hasMore = false;
      break;
    }
  }
};

const deleteWorkspaceNodes = async (workspaceId: string) => {
  let hasMore = true;

  while (hasMore) {
    const nodes = await database
      .selectFrom('nodes')
      .select('id')
      .where('workspace_id', '=', workspaceId)
      .limit(BATCH_SIZE)
      .execute();

    const nodeIds = nodes.map((node) => node.id);
    if (nodeIds.length === 0) {
      hasMore = false;
      break;
    }

    // delete node updates
    await database
      .deleteFrom('node_updates')
      .where('node_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('node_reactions')
      .where('node_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('node_interactions')
      .where('node_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('node_tombstones')
      .where('id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('node_embeddings')
      .where('node_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('collaborations')
      .where('node_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('document_embeddings')
      .where('document_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('document_updates')
      .where('document_id', 'in', nodeIds)
      .execute();

    await database
      .deleteFrom('document_embeddings')
      .where('document_id', 'in', nodeIds)
      .execute();

    await database.deleteFrom('nodes').where('id', 'in', nodeIds).execute();
  }
};

const deleteWorkspaceUploads = async (workspaceId: string) => {
  let hasMore = true;

  while (hasMore) {
    const uploads = await database
      .selectFrom('uploads')
      .select(['file_id', 'path'])
      .where('workspace_id', '=', workspaceId)
      .limit(BATCH_SIZE)
      .execute();

    if (uploads.length === 0) {
      hasMore = false;
      break;
    }

    for (const upload of uploads) {
      await deleteFile(upload.path);
    }

    const fileIds = uploads.map((upload) => upload.file_id);
    await database
      .deleteFrom('uploads')
      .where('file_id', 'in', fileIds)
      .execute();
  }
};
