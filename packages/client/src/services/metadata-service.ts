import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAppMetadata } from '@colanode/client/lib/mappers';
import { AppService } from '@colanode/client/services/app-service';
import {
  AppMetadata,
  AppMetadataKey,
  AppMetadataMap,
} from '@colanode/client/types/apps';
import { createDebugger } from '@colanode/core';

const debug = createDebugger('desktop:service:metadata');

export class MetadataService {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async getAll(): Promise<AppMetadata[]> {
    const metadata = await this.app.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return metadata.map(mapAppMetadata);
  }

  public async get<K extends AppMetadataKey>(
    key: K
  ): Promise<AppMetadataMap[K] | null> {
    const metadata = await this.app.database
      .selectFrom('metadata')
      .selectAll()
      .where('key', '=', key)
      .executeTakeFirst();

    if (!metadata) {
      return null;
    }

    return mapAppMetadata(metadata) as AppMetadataMap[K];
  }

  public async set<K extends AppMetadataKey>(
    key: K,
    value: AppMetadataMap[K]['value']
  ) {
    debug(`Setting metadata key ${key} to value ${value}`);

    const createdMetadata = await this.app.database
      .insertInto('metadata')
      .returningAll()
      .values({
        key,
        value: JSON.stringify(value),
        created_at: new Date().toISOString(),
      })
      .onConflict((b) =>
        b.column('key').doUpdateSet({
          value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdMetadata) {
      return;
    }

    eventBus.publish({
      type: 'app.metadata.updated',
      metadata: mapAppMetadata(createdMetadata),
    });
  }

  public async delete(key: string) {
    debug(`Deleting metadata key ${key}`);

    const deletedMetadata = await this.app.database
      .deleteFrom('metadata')
      .where('key', '=', key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return;
    }

    eventBus.publish({
      type: 'app.metadata.deleted',
      metadata: mapAppMetadata(deletedMetadata),
    });
  }
}
