import { eventBus } from '@colanode/client/lib/event-bus';
import { mapMetadata } from '@colanode/client/lib/mappers';
import { AppService } from '@colanode/client/services/app-service';
import { Metadata } from '@colanode/client/types/apps';
import { createDebugger } from '@colanode/core';

const debug = createDebugger('desktop:service:metadata');

export class MetadataService {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async getAll(): Promise<Metadata[]> {
    const metadata = await this.app.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return metadata.map(mapMetadata);
  }

  public async get(namespace: string, key: string): Promise<Metadata | null> {
    const metadata = await this.app.database
      .selectFrom('metadata')
      .selectAll()
      .where('namespace', '=', namespace)
      .where('key', '=', key)
      .executeTakeFirst();

    if (!metadata) {
      return null;
    }

    return mapMetadata(metadata);
  }

  public async set(namespace: string, key: string, value: unknown) {
    debug(`Setting metadata key ${key} to value ${value}`);

    const json = JSON.stringify(value);
    const createdMetadata = await this.app.database
      .insertInto('metadata')
      .returningAll()
      .values({
        namespace,
        key,
        value: json,
        created_at: new Date().toISOString(),
      })
      .onConflict((b) =>
        b.columns(['namespace', 'key']).doUpdateSet({
          value: json,
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdMetadata) {
      return;
    }

    eventBus.publish({
      type: 'metadata.updated',
      metadata: mapMetadata(createdMetadata),
    });
  }

  public async delete(namespace: string, key: string) {
    debug(`Deleting metadata key ${key}`);

    const deletedMetadata = await this.app.database
      .deleteFrom('metadata')
      .where('namespace', '=', namespace)
      .where('key', '=', key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return;
    }

    eventBus.publish({
      type: 'metadata.deleted',
      metadata: mapMetadata(deletedMetadata),
    });
  }
}
