import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

import { WorkspaceRole } from '@colanode/core';

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

interface AvatarTable {
  id: ColumnType<string, string, never>;
  path: ColumnType<string, string, string>;
  size: ColumnType<number, number, number>;
  created_at: ColumnType<string, string, never>;
  opened_at: ColumnType<string, string, string>;
}

export type SelectAvatar = Selectable<AvatarTable>;
export type CreateAvatar = Insertable<AvatarTable>;
export type UpdateAvatar = Updateable<AvatarTable>;

export interface AccountDatabaseSchema {
  workspaces: WorkspaceTable;
  metadata: AccountMetadataTable;
  avatars: AvatarTable;
}
