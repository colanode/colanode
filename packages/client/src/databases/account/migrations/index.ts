import { Migration } from 'kysely';

import { createWorkspacesTable } from './00001-create-workspaces-table';
import { createMetadataTable } from './00002-create-metadata-table';

export const accountDatabaseMigrations: Record<string, Migration> = {
  '00001-create-workspaces-table': createWorkspacesTable,
  '00002-create-metadata-table': createMetadataTable,
};
