import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface AccountTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  email: ColumnType<string, string, never>;
  avatar: ColumnType<string | null, string | null, string | null>;
  token: ColumnType<string, string, string>;
  device_id: ColumnType<string, string, never>;
}

export type SelectAccount = Selectable<AccountTable>;
export type CreateAccount = Insertable<AccountTable>;
export type UpdateAccount = Updateable<AccountTable>;

interface WorkspaceTable {
  id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  avatar: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  role: ColumnType<number, number, number>;
  user_id: ColumnType<string, string, never>;
  synced: ColumnType<number, number, number>;
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

export interface AppDatabaseSchema {
  accounts: AccountTable;
  workspaces: WorkspaceTable;
}