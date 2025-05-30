import { Migration } from 'kysely';

import { createServersTable } from './00001-create-servers-table';
import { createAccountsTable } from './00002-create-accounts-table';
import { createDeletedTokensTable } from './00003-create-deleted-tokens-table';
import { createMetadataTable } from './00004-create-metadata-table';

export const appDatabaseMigrations: Record<string, Migration> = {
  '00001-create-servers-table': createServersTable,
  '00002-create-accounts-table': createAccountsTable,
  '00003-create-deleted-tokens-table': createDeletedTokensTable,
  '00004-create-metadata-table': createMetadataTable,
};
