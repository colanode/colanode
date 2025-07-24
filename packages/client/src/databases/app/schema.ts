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

interface AppMetadataTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectAppMetadata = Selectable<AppMetadataTable>;
export type CreateAppMetadata = Insertable<AppMetadataTable>;
export type UpdateAppMetadata = Updateable<AppMetadataTable>;

export interface JobTableSchema {
  id: ColumnType<string, string, never>;
  queue: ColumnType<string, string, never>;
  input: ColumnType<string, string, string>;
  options: ColumnType<string | null, string | null, string | null>;
  status: ColumnType<string, string, string>;
  retries: ColumnType<number, number, number>;
  scheduled_at: ColumnType<number, number, number>;
  deduplication_key: ColumnType<string | null, string | null, string | null>;
  concurrency_key: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<number, number, number>;
  updated_at: ColumnType<number, number, number>;
}

export type SelectJob = Selectable<JobTableSchema>;
export type InsertJob = Insertable<JobTableSchema>;
export type UpdateJob = Updateable<JobTableSchema>;

export interface JobScheduleTableSchema {
  id: ColumnType<string, string, never>;
  queue: ColumnType<string, string, never>;
  input: ColumnType<string, string, string>;
  options: ColumnType<string | null, string | null, string | null>;
  status: ColumnType<string, string, string>;
  interval: ColumnType<number, number, number>;
  next_run_at: ColumnType<number, number, number>;
  last_run_at: ColumnType<number | null, number | null, number | null>;
  created_at: ColumnType<number, number, number>;
  updated_at: ColumnType<number, number, number>;
}

export type SelectJobSchedule = Selectable<JobScheduleTableSchema>;
export type InsertJobSchedule = Insertable<JobScheduleTableSchema>;
export type UpdateJobSchedule = Updateable<JobScheduleTableSchema>;

export interface AppDatabaseSchema {
  servers: ServerTable;
  accounts: AccountTable;
  metadata: AppMetadataTable;
  jobs: JobTableSchema;
  job_schedules: JobScheduleTableSchema;
}
