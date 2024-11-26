import { WorkspaceRole } from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface ServerTable {
  domain: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string, string, string>;
  attributes: ColumnType<string, string, string>;
  version: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, string>;
  last_synced_at: ColumnType<string | null, string | null, string>;
}

export type SelectServer = Selectable<ServerTable>;
export type CreateServer = Insertable<ServerTable>;
export type UpdateServer = Updateable<ServerTable>;

interface AccountTable {
  id: ColumnType<string, string, never>;
  server: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  email: ColumnType<string, string, never>;
  avatar: ColumnType<string | null, string | null, string | null>;
  token: ColumnType<string, string, string>;
  device_id: ColumnType<string, string, never>;
  status: ColumnType<string, string, string>;
}

export type SelectAccount = Selectable<AccountTable>;
export type CreateAccount = Insertable<AccountTable>;
export type UpdateAccount = Updateable<AccountTable>;

interface WorkspaceTable {
  user_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  avatar: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

interface WorkspaceCursorTable {
  user_id: ColumnType<string, string, never>;
  node_transactions: ColumnType<bigint, bigint, bigint>;
  collaborations: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, string>;
  updated_at: ColumnType<string | null, string | null, string>;
}

export type SelectWorkspaceCursor = Selectable<WorkspaceCursorTable>;
export type CreateWorkspaceCursor = Insertable<WorkspaceCursorTable>;
export type UpdateWorkspaceCursor = Updateable<WorkspaceCursorTable>;

interface DeletedTokenTable {
  token: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  server: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, string>;
}

export interface AppDatabaseSchema {
  servers: ServerTable;
  accounts: AccountTable;
  workspaces: WorkspaceTable;
  workspace_cursors: WorkspaceCursorTable;
  deleted_tokens: DeletedTokenTable;
}
