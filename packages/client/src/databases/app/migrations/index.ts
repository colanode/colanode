import { Migration } from 'kysely';

import { createServersTable } from './00001-create-servers-table';
import { createAccountsTable } from './00002-create-accounts-table';
import { createDeletedTokensTable } from './00003-create-deleted-tokens-table';
import { createMetadataTable } from './00004-create-metadata-table';
import { createJobsTable } from './00005-create-jobs-table';
import { createJobSchedulesTable } from './00006-create-job-schedules-table';
import { dropDeletedTokensTable } from './00007-drop-deleted-tokens-table';
import { createTempFilesTable } from './00008-create-temp-files-table';

export const appDatabaseMigrations: Record<string, Migration> = {
  '00001-create-servers-table': createServersTable,
  '00002-create-accounts-table': createAccountsTable,
  '00003-create-deleted-tokens-table': createDeletedTokensTable,
  '00004-create-metadata-table': createMetadataTable,
  '00005-create-jobs-table': createJobsTable,
  '00006-create-job-schedules-table': createJobSchedulesTable,
  '00007-drop-deleted-tokens-table': dropDeletedTokensTable,
  '00008-create-temp-files-table': createTempFilesTable,
};
