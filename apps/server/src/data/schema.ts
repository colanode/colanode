import { NodeAttributes, WorkspaceRole } from '@colanode/core';
import {
  ColumnType,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from 'kysely';

interface AccountTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  email: ColumnType<string, string, never>;
  avatar: ColumnType<string | null, string | null, string | null>;
  password: ColumnType<string | null, string | null, string | null>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  status: ColumnType<number, number, number>;
}

export type SelectAccount = Selectable<AccountTable>;
export type CreateAccount = Insertable<AccountTable>;
export type UpdateAccount = Updateable<AccountTable>;

interface DeviceTable {
  id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  token_hash: ColumnType<string, string, string>;
  token_salt: ColumnType<string, string, string>;
  token_generated_at: ColumnType<Date, Date, Date>;
  previous_token_hash: ColumnType<string | null, string | null, string | null>;
  previous_token_salt: ColumnType<string | null, string | null, string | null>;
  type: ColumnType<number, number, number>;
  version: ColumnType<string, string, string>;
  platform: ColumnType<string | null, string | null, string | null>;
  cpu: ColumnType<string | null, string | null, string | null>;
  hostname: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  last_online_at: ColumnType<Date | null, Date | null, Date>;
  last_active_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectDevice = Selectable<DeviceTable>;
export type CreateDevice = Insertable<DeviceTable>;
export type UpdateDevice = Updateable<DeviceTable>;

interface WorkspaceTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  avatar: ColumnType<string | null, string | null, string | null>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<number, number, number>;
  version_id: ColumnType<string, string, string>;
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

interface WorkspaceUserTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<number, number, number>;
  version_id: ColumnType<string, string, string>;
}

export type SelectWorkspaceUser = Selectable<WorkspaceUserTable>;
export type CreateWorkspaceUser = Insertable<WorkspaceUserTable>;
export type UpdateWorkspaceUser = Updateable<WorkspaceUserTable>;

interface NodeTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  parent_id: ColumnType<string, never, never>;
  type: ColumnType<string, never, never>;
  attributes: JSONColumnType<NodeAttributes, string | null, string | null>;
  state: ColumnType<Uint8Array, Uint8Array, Uint8Array>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<Date, Date, never>;
  server_updated_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodePathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectNodePath = Selectable<NodePathTable>;
export type CreateNodePath = Insertable<NodePathTable>;
export type UpdateNodePath = Updateable<NodePathTable>;

interface UserNodeTable {
  node_id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  last_seen_version_id: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<Date | null, Date | null, Date>;
  mentions_count: ColumnType<number, number, number>;
  attributes: JSONColumnType<any, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  access_removed_at: ColumnType<Date | null, Date | null, Date>;
  version_id: ColumnType<string, string, string>;
}

export type SelectUserNode = Selectable<UserNodeTable>;
export type CreateUserNode = Insertable<UserNodeTable>;
export type UpdateUserNode = Updateable<UserNodeTable>;

interface DeviceNodeTable {
  device_id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, string>;
  node_version_id: ColumnType<string | null, string | null, string | null>;
  user_node_version_id: ColumnType<string | null, string | null, string | null>;
  node_synced_at: ColumnType<Date | null, Date | null, Date>;
  user_node_synced_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectDeviceNode = Selectable<DeviceNodeTable>;
export type CreateDeviceNode = Insertable<DeviceNodeTable>;
export type UpdateDeviceNode = Updateable<DeviceNodeTable>;

interface UploadTable {
  node_id: ColumnType<string, string, never>;
  upload_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  path: ColumnType<string, string, string>;
  size: ColumnType<number, number, number>;
  mime_type: ColumnType<string, string, string>;
  type: ColumnType<string, string, string>;
  created_by: ColumnType<string, string, never>;
  created_at: ColumnType<Date, Date, never>;
  completed_at: ColumnType<Date, Date, never>;
}

export interface DatabaseSchema {
  accounts: AccountTable;
  devices: DeviceTable;
  workspaces: WorkspaceTable;
  workspace_users: WorkspaceUserTable;
  nodes: NodeTable;
  node_paths: NodePathTable;
  user_nodes: UserNodeTable;
  device_nodes: DeviceNodeTable;
  uploads: UploadTable;
}
