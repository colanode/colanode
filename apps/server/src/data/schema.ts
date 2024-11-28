import { NodeAttributes, NodeRole, WorkspaceRole } from '@colanode/core';
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
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  transaction_id: ColumnType<string, string, string>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeTransactionTable {
  id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  node_type: ColumnType<string, string, never>;
  operation: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  data: ColumnType<Uint8Array | null, Uint8Array | null, Uint8Array | null>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  server_created_at: ColumnType<Date, Date, never>;
  version: ColumnType<bigint, never, never>;
}

export type SelectNodeTransaction = Selectable<NodeTransactionTable>;
export type CreateNodeTransaction = Insertable<NodeTransactionTable>;
export type UpdateNodeTransaction = Updateable<NodeTransactionTable>;

interface CollaborationTable {
  user_id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  type: ColumnType<string, never, never>;
  workspace_id: ColumnType<string, string, never>;
  roles: JSONColumnType<Record<string, NodeRole>, string, string>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface CollaborationRevocationTable {
  user_id: ColumnType<string, never, never>;
  node_id: ColumnType<string, never, never>;
  workspace_id: ColumnType<string, string, never>;
  created_at: ColumnType<Date, never, never>;
  version: ColumnType<bigint, never, never>;
}

export type SelectCollaborationRevocation =
  Selectable<CollaborationRevocationTable>;
export type CreateCollaborationRevocation =
  Insertable<CollaborationRevocationTable>;
export type UpdateCollaborationRevocation =
  Updateable<CollaborationRevocationTable>;

interface NodePathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectNodePath = Selectable<NodePathTable>;
export type CreateNodePath = Insertable<NodePathTable>;
export type UpdateNodePath = Updateable<NodePathTable>;

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
  node_transactions: NodeTransactionTable;
  collaborations: CollaborationTable;
  collaboration_revocations: CollaborationRevocationTable;
  node_paths: NodePathTable;
  uploads: UploadTable;
}
