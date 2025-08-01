import { Migration } from 'kysely';

import { CreateUpload } from '@colanode/client/databases/workspace';
import { UploadStatus } from '@colanode/client/types/files';

export const dropFileStatesTable: Migration = {
  up: async (db) => {
    const pendingUploads = await db
      .selectFrom('file_states')
      .select(['id'])
      .where('upload_status', '=', 1)
      .execute();

    if (pendingUploads.length > 0) {
      const uploadsToCreate: CreateUpload[] = pendingUploads.map((upload) => ({
        file_id: upload.id,
        status: UploadStatus.Pending,
        progress: 0,
        retries: 0,
        created_at: new Date().toISOString(),
      }));

      await db
        .insertInto('uploads')
        .values(uploadsToCreate)
        .onConflict((oc) => oc.column('file_id').doNothing())
        .execute();
    }

    await db.schema.dropTable('file_states').execute();
  },
  down: async (db) => {
    await db.schema
      .createTable('file_states')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('download_status', 'integer')
      .addColumn('download_progress', 'integer')
      .addColumn('download_retries', 'integer')
      .addColumn('download_started_at', 'text')
      .addColumn('download_completed_at', 'text')
      .addColumn('upload_status', 'integer')
      .addColumn('upload_progress', 'integer')
      .addColumn('upload_retries', 'integer')
      .addColumn('upload_started_at', 'text')
      .addColumn('upload_completed_at', 'text')
      .execute();
  },
};
