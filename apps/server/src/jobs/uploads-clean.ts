import { database } from '@colanode/server/data/database';
import { redis } from '@colanode/server/data/redis';
import { JobHandler } from '@colanode/server/jobs';
import { deleteFile } from '@colanode/server/lib/files';
import { createLogger } from '@colanode/server/lib/logger';
import { RedisKvStore } from '@colanode/server/lib/tus/redis-kv';

const logger = createLogger('server:job:uploads-clean');

export type UploadsCleanInput = {
  type: 'uploads.clean';
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'uploads.clean': {
      input: UploadsCleanInput;
    };
  }
}

export const uploadsCleanHandler: JobHandler<UploadsCleanInput> = async () => {
  logger.debug(`Cleaning uploads`);

  try {
    // Delete uploads that are older than 7 days
    const expiration = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const expiredUploads = await database
      .selectFrom('uploads')
      .selectAll()
      .where('created_at', '<', expiration)
      .where('uploaded_at', 'is', null)
      .execute();

    if (expiredUploads.length === 0) {
      logger.debug(`No expired uploads found`);
      return;
    }

    const redisKv = new RedisKvStore(redis);
    for (const upload of expiredUploads) {
      await deleteFile(upload.path);
      await redisKv.delete(upload.path);

      const infoPath = `${upload.path}.info`;
      await deleteFile(infoPath);
    }

    logger.debug(`Deleted ${expiredUploads.length} expired uploads`);
  } catch (error) {
    logger.error(error, `Error cleaning workspace data`);
    throw error;
  }
};
