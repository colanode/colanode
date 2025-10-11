import { Migration } from 'kysely';

import { createUsersTable } from './00001-create-users-table';
import { createNodesTable } from './00002-create-nodes-table';
import { createNodeStatesTable } from './00003-create-node-states-table';
import { createNodeUpdatesTable } from './00004-create-node-updates-table';
import { createNodeInteractionsTable } from './00005-create-node-interactions-table';
import { createNodeReactionsTable } from './00006-create-node-reactions-table';
import { createNodeTextsTable } from './00007-create-node-texts-table';
import { createDocumentsTable } from './00008-create-documents-table';
import { createDocumentStatesTable } from './00009-create-document-states-table';
import { createDocumentUpdatesTable } from './00010-create-document-updates-table';
import { createDocumentTextsTable } from './00011-create-document-texts-table';
import { createCollaborationsTable } from './00012-create-collaborations-table';
import { createMutationsTable } from './00013-create-mutations-table';
import { createTombstonesTable } from './00014-create-tombstones-table';
import { createCursorsTable } from './00015-create-cursors-table';
import { createNodeReferencesTable } from './00016-create-node-references-table';
import { createNodeCountersTable } from './00017-create-node-counters-table';
import { createLocalFilesTable } from './00018-create-local-files-table';
import { createUploadsTable } from './00019-create-uploads-table';
import { createDownloadsTable } from './00020-create-downloads-table';

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001-create-users-table': createUsersTable,
  '00002-create-nodes-table': createNodesTable,
  '00003-create-node-states-table': createNodeStatesTable,
  '00004-create-node-updates-table': createNodeUpdatesTable,
  '00005-create-node-interactions-table': createNodeInteractionsTable,
  '00006-create-node-reactions-table': createNodeReactionsTable,
  '00007-create-node-texts-table': createNodeTextsTable,
  '00008-create-documents-table': createDocumentsTable,
  '00009-create-document-states-table': createDocumentStatesTable,
  '00010-create-document-updates-table': createDocumentUpdatesTable,
  '00011-create-document-texts-table': createDocumentTextsTable,
  '00012-create-collaborations-table': createCollaborationsTable,
  '00013-create-mutations-table': createMutationsTable,
  '00014-create-tombstones-table': createTombstonesTable,
  '00015-create-cursors-table': createCursorsTable,
  '00016-create-node-references-table': createNodeReferencesTable,
  '00017-create-node-counters-table': createNodeCountersTable,
  '00018-create-local-files-table': createLocalFilesTable,
  '00019-create-uploads-table': createUploadsTable,
  '00020-create-downloads-table': createDownloadsTable,
};
