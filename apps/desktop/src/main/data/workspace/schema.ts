import {
  InteractionAttribute,
  NodeType,
  SyncConsumerType,
} from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface NodeTable {
  id: ColumnType<string, string, never>;
  parent_id: ColumnType<string, never, never>;
  type: ColumnType<NodeType, never, never>;
  attributes: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  transaction_id: ColumnType<string, string, string>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodePathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectNodePath = Selectable<NodePathTable>;

interface NodeTransactionTable {
  id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  node_type: ColumnType<NodeType, NodeType, never>;
  operation: ColumnType<string, string, never>;
  data: ColumnType<Uint8Array | null, Uint8Array | null, never>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  retry_count: ColumnType<number, number, number>;
  status: ColumnType<string, string, string>;
  version: ColumnType<bigint | null, bigint | null, bigint | null>;
}

export type SelectNodeTransaction = Selectable<NodeTransactionTable>;
export type CreateNodeTransaction = Insertable<NodeTransactionTable>;
export type UpdateNodeTransaction = Updateable<NodeTransactionTable>;

interface CollaborationTable {
  user_id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  roles: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface UploadTable {
  node_id: ColumnType<string, string, never>;
  upload_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  progress: ColumnType<number, number, number>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectUpload = Selectable<UploadTable>;
export type CreateUpload = Insertable<UploadTable>;
export type UpdateUpload = Updateable<UploadTable>;

interface DownloadTable {
  node_id: ColumnType<string, string, never>;
  upload_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  completed_at: ColumnType<string | null, string | null, string | null>;
  progress: ColumnType<number, number, number>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectDownload = Selectable<DownloadTable>;
export type CreateDownload = Insertable<DownloadTable>;
export type UpdateDownload = Updateable<DownloadTable>;

interface InteractionTable {
  user_id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  node_type: ColumnType<NodeType, NodeType, never>;
  attributes: ColumnType<string, string, string>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint | null, bigint | null, bigint | null>;
}

export type SelectInteraction = Selectable<InteractionTable>;
export type CreateInteraction = Insertable<InteractionTable>;
export type UpdateInteraction = Updateable<InteractionTable>;

interface InteractionEventTable {
  node_id: ColumnType<string, string, never>;
  node_type: ColumnType<NodeType, NodeType, never>;
  attribute: ColumnType<InteractionAttribute, string, string>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  sent_at: ColumnType<string | null, string | null, string | null>;
  event_id: ColumnType<string, string, string>;
}

export type SelectInteractionEvent = Selectable<InteractionEventTable>;
export type CreateInteractionEvent = Insertable<InteractionEventTable>;
export type UpdateInteractionEvent = Updateable<InteractionEventTable>;

interface CursorTable {
  type: ColumnType<SyncConsumerType, SyncConsumerType, never>;
  value: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export interface WorkspaceDatabaseSchema {
  nodes: NodeTable;
  node_transactions: NodeTransactionTable;
  node_paths: NodePathTable;
  collaborations: CollaborationTable;
  uploads: UploadTable;
  downloads: DownloadTable;
  interactions: InteractionTable;
  interaction_events: InteractionEventTable;
  cursors: CursorTable;
}
