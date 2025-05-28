import { Migration } from 'kysely';

export const alterDevicesPlatformColumn: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('devices')
      .alterColumn('platform', (col) => col.setDataType('varchar(255)'))
      .execute();
  },
  down: async (db) => {
    await db.schema
      .alterTable('devices')
      .alterColumn('platform', (col) => col.setDataType('varchar(30)'))
      .execute();
  },
};
