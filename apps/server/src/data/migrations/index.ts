import { Migration } from 'kysely';

import { createAccountsTable } from './00001-create-accounts-table';
import { createDevicesTable } from './00002-create-devices-table';
import { createWorkspacesTable } from './00003-create-workspaces-table';
import { createUsersTable } from './00004-create-users-table';
import { createNodesTable } from './00005-create-nodes-table';
import { createNodeUpdatesTable } from './00006-create-node-updates-table';
import { createNodeReactionsTable } from './00007-create-node-reactions-table';
import { createNodeInteractionsTable } from './00008-create-node-interactions-table';
import { createNodeTombstonesTable } from './00009-create-node-tombstones-table';
import { createNodePathsTable } from './00010-create-node-paths-table';
import { createCollaborationsTable } from './00011-create-collaborations-table';
import { createDocumentsTable } from './00012-create-documents-table';
import { createDocumentUpdatesTable } from './00013-create-document-updates-table';
import { createUploadsTable } from './00014-create-uploads-table';
import { createNodePathsIndexes } from './00015-create-node-paths-indexes';
import { createUserAccountIdIndex } from './00016-create-user-account-id-index';
import { createVectorExtension } from './00017-create-vector-extension';
import { createNodeEmbeddingsTable } from './00018-create-node-embeddings-table';
import { createDocumentEmbeddingsTable } from './00019-create-document-embeddings-table';

export const databaseMigrations: Record<string, Migration> = {
  '00001_create_accounts_table': createAccountsTable,
  '00002_create_devices_table': createDevicesTable,
  '00003_create_workspaces_table': createWorkspacesTable,
  '00004_create_users_table': createUsersTable,
  '00005_create_nodes_table': createNodesTable,
  '00006_create_node_updates_table': createNodeUpdatesTable,
  '00007_create_node_reactions_table': createNodeReactionsTable,
  '00008_create_node_interactions_table': createNodeInteractionsTable,
  '00009_create_node_tombstones_table': createNodeTombstonesTable,
  '00010_create_node_paths_table': createNodePathsTable,
  '00011_create_collaborations_table': createCollaborationsTable,
  '00012_create_documents_table': createDocumentsTable,
  '00013_create_document_updates_table': createDocumentUpdatesTable,
  '00014_create_uploads_table': createUploadsTable,
  '00015_create_node_paths_indexes': createNodePathsIndexes,
  '00016_create_user_account_id_index': createUserAccountIdIndex,
  '00017_create_vector_extension': createVectorExtension,
  '00018_create_node_embeddings_table': createNodeEmbeddingsTable,
  '00019_create_document_embeddings_table': createDocumentEmbeddingsTable,
};
