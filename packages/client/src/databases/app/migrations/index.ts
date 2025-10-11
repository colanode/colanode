import { Migration } from 'kysely';

import { createServersTable } from './00001-create-servers-table';
import { createMetadataTable } from './00002-create-metadata-table';
import { createAccountsTable } from './00003-create-accounts-table';
import { createWorkspacesTable } from './00004-create-workspaces-table';
import { createJobsTable } from './00005-create-jobs-table';
import { createJobSchedulesTable } from './00006-create-job-schedules-table';
import { createTempFilesTable } from './00007-create-temp-files-table';
import { createAvatarsTable } from './00008-create-avatars-table';
import { createTabsTable } from './00009-create-tabs-table';

export const appDatabaseMigrations: Record<string, Migration> = {
  '00001-create-servers-table': createServersTable,
  '00002-create-metadata-table': createMetadataTable,
  '00003-create-accounts-table': createAccountsTable,
  '00004-create-workspaces-table': createWorkspacesTable,
  '00005-create-jobs-table': createJobsTable,
  '00006-create-job-schedules-table': createJobSchedulesTable,
  '00007-create-temp-files-table': createTempFilesTable,
  '00008-create-avatars-table': createAvatarsTable,
  '00009-create-tabs-table': createTabsTable,
};
