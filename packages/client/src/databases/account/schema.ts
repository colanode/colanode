import { WorkspaceRole } from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface WorkspaceTable {
  id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  avatar: ColumnType<string | null, string | null, string | null>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  storage_limit: ColumnType<string, string, string>;
  max_file_size: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

interface AccountMetadataTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectAccountMetadata = Selectable<AccountMetadataTable>;
export type CreateAccountMetadata = Insertable<AccountMetadataTable>;
export type UpdateAccountMetadata = Updateable<AccountMetadataTable>;

export interface AccountDatabaseSchema {
  workspaces: WorkspaceTable;
  metadata: AccountMetadataTable;
}
