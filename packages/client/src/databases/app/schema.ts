import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface ServerTable {
  domain: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string, string, string>;
  attributes: ColumnType<string, string, string>;
  version: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, string>;
  synced_at: ColumnType<string | null, string | null, string>;
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
  created_at: ColumnType<string, string, string>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  synced_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectAccount = Selectable<AccountTable>;
export type CreateAccount = Insertable<AccountTable>;
export type UpdateAccount = Updateable<AccountTable>;

interface DeletedTokenTable {
  token: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  server: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, string>;
}

interface AppMetadataTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectAppMetadata = Selectable<AppMetadataTable>;
export type CreateAppMetadata = Insertable<AppMetadataTable>;
export type UpdateAppMetadata = Updateable<AppMetadataTable>;

export interface AppDatabaseSchema {
  servers: ServerTable;
  accounts: AccountTable;
  deleted_tokens: DeletedTokenTable;
  metadata: AppMetadataTable;
}
