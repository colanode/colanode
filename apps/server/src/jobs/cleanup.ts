import { DeleteResult } from 'kysely';
import ms from 'ms';

import { database } from '@colanode/server/data/database';
import { JobHandler } from '@colanode/server/jobs';
import { createLogger } from '@colanode/server/lib/logger';
import { storage } from '@colanode/server/lib/storage';

const logger = createLogger('server:job:cleanup');

export type CleanupInput = {
  type: 'cleanup';
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    cleanup: {
      input: CleanupInput;
    };
  }
}

export const cleanupHandler: JobHandler<CleanupInput> = async () => {
  logger.debug(`Cleaning up`);
  await cleanNodeRelations();
  await cleanDocuments();
  await cleanUploads();
};

const cleanNodeRelations = async () => {
  try {
    // clean node relations that are not referenced by any node
    const nodeUpdates = await database
      .deleteFrom('node_updates')
      .where('node_id', 'not in', (qb) => qb.selectFrom('nodes').select('id'))
      .execute();

    logDeletedRows(nodeUpdates, 'node_updates');

    const nodeInteractions = await database
      .deleteFrom('node_interactions')
      .where('node_id', 'not in', (qb) => qb.selectFrom('nodes').select('id'))
      .execute();

    logDeletedRows(nodeInteractions, 'node_interactions');

    const nodeReactions = await database
      .deleteFrom('node_reactions')
      .where('node_id', 'not in', (qb) => qb.selectFrom('nodes').select('id'))
      .execute();

    logDeletedRows(nodeReactions, 'node_reactions');

    const nodeEmbeddings = await database
      .deleteFrom('node_embeddings')
      .where('node_id', 'not in', (qb) => qb.selectFrom('nodes').select('id'))
      .execute();

    logDeletedRows(nodeEmbeddings, 'node_embeddings');

    const collaborations = await database
      .deleteFrom('collaborations')
      .where('node_id', 'not in', (qb) => qb.selectFrom('nodes').select('id'))
      .execute();

    logDeletedRows(collaborations, 'collaborations');
  } catch (error) {
    logger.error(error, `Error cleaning node relations`);
    throw error;
  }
};

const cleanDocuments = async () => {
  try {
    // clean documents that are not referenced by any node
    const documents = await database
      .deleteFrom('documents')
      .where('id', 'not in', (qb) => qb.selectFrom('nodes').select('id'))
      .execute();

    logDeletedRows(documents, 'documents');

    const documentUpdates = await database
      .deleteFrom('document_updates')
      .where('document_id', 'not in', (qb) =>
        qb.selectFrom('nodes').select('id')
      )
      .execute();

    logDeletedRows(documentUpdates, 'document_updates');

    const documentEmbeddings = await database
      .deleteFrom('document_embeddings')
      .where('document_id', 'not in', (qb) =>
        qb.selectFrom('nodes').select('id')
      )
      .execute();

    logDeletedRows(documentEmbeddings, 'document_embeddings');
  } catch (error) {
    logger.error(error, `Error cleaning documents`);
    throw error;
  }
};

const cleanUploads = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - ms('7 days'));
    // Select uploads where file node does not exist OR (not uploaded and created at is older than 7 days)
    const uploads = await database
      .selectFrom('uploads')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('file_id', 'not in', (qb) => qb.selectFrom('nodes').select('id')),
          eb.and([
            eb('uploaded_at', 'is', null),
            eb('created_at', '<', sevenDaysAgo),
          ]),
        ])
      )
      .execute();

    if (uploads.length === 0) {
      return;
    }

    for (const upload of uploads) {
      await storage.delete(upload.path);

      await database
        .deleteFrom('uploads')
        .where('file_id', '=', upload.file_id)
        .where('upload_id', '=', upload.upload_id)
        .execute();
    }

    logger.debug(`Deleted ${uploads.length.toLocaleString()} uploads`);
  } catch (error) {
    logger.error(error, `Error cleaning uploads`);
  }
};

const logDeletedRows = (result: DeleteResult[], label: string) => {
  let count = BigInt(0);
  for (const row of result) {
    count += row.numDeletedRows;
  }

  if (count > 0) {
    logger.debug(`Deleted ${count.toLocaleString()} ${label}`);
  }
};
