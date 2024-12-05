import { databaseService } from '../data/database-service';

class MetadataService {
  public async get<T>(key: string): Promise<T | null> {
    const metadata = await databaseService.appDatabase
      .selectFrom('metadata')
      .selectAll()
      .where('key', '=', key)
      .executeTakeFirst();

    if (!metadata) {
      return null;
    }

    return JSON.parse(metadata.value) as T;
  }

  public async set<T>(key: string, value: T) {
    await databaseService.appDatabase
      .insertInto('metadata')
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
      .execute();
  }

  public async delete(key: string) {
    await databaseService.appDatabase
      .deleteFrom('metadata')
      .where('key', '=', key)
      .execute();
  }
}

export const metadataService = new MetadataService();
