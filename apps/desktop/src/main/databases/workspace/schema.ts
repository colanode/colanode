import {
  MutationType,
  NodeType,
  WorkspaceRole,
  UserStatus,
} from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

import { DownloadStatus, UploadStatus } from '@/shared/types/files';
import { NodeCounterType } from '@/shared/types/nodes';

interface UserTable {
  id: ColumnType<string, string, never>;
  email: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string | null, string | null, string | null>;
  custom_name: ColumnType<string | null, string | null, string | null>;
  custom_avatar: ColumnType<string | null, string | null, string | null>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  status: ColumnType<UserStatus, UserStatus, UserStatus>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  revision: ColumnType<string, string, string>;
}

export type SelectUser = Selectable<UserTable>;
export type CreateUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

interface NodeTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<NodeType, never, never>;
  parent_id: ColumnType<string | null, never, never>;
  root_id: ColumnType<string, string, never>;
  attributes: ColumnType<string, string, string>;
  local_revision: ColumnType<string, string, string>;
  server_revision: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeStateTable {
  id: ColumnType<string, string, never>;
  state: ColumnType<Uint8Array, Uint8Array, Uint8Array>;
  revision: ColumnType<string, string, string>;
}

export type SelectNodeState = Selectable<NodeStateTable>;
export type CreateNodeState = Insertable<NodeStateTable>;
export type UpdateNodeState = Updateable<NodeStateTable>;

interface NodeUpdateTable {
  id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  data: ColumnType<Uint8Array, Uint8Array, never>;
  created_at: ColumnType<string, string, never>;
}

export type SelectNodeUpdate = Selectable<NodeUpdateTable>;
export type CreateNodeUpdate = Insertable<NodeUpdateTable>;
export type UpdateNodeUpdate = Updateable<NodeUpdateTable>;

interface NodeInteractionTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  revision: ColumnType<string, string, string>;
  first_seen_at: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  first_opened_at: ColumnType<string | null, string | null, string | null>;
  last_opened_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeInteraction = Selectable<NodeInteractionTable>;
export type CreateNodeInteraction = Insertable<NodeInteractionTable>;
export type UpdateNodeInteraction = Updateable<NodeInteractionTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, string>;
  root_id: ColumnType<string, string, string>;
  revision: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface NodeReferenceTable {
  node_id: ColumnType<string, string, never>;
  reference_id: ColumnType<string, string, never>;
  inner_id: ColumnType<string, string, never>;
  type: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
}

export type SelectNodeReference = Selectable<NodeReferenceTable>;
export type CreateNodeReference = Insertable<NodeReferenceTable>;
export type UpdateNodeReference = Updateable<NodeReferenceTable>;

interface NodeCounterTable {
  node_id: ColumnType<string, string, never>;
  type: ColumnType<NodeCounterType, NodeCounterType, never>;
  count: ColumnType<number, number, number>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeCounter = Selectable<NodeCounterTable>;
export type CreateNodeCounter = Insertable<NodeCounterTable>;
export type UpdateNodeCounter = Updateable<NodeCounterTable>;

interface NodeTextTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string | null, string | null, string | null>;
  attributes: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeText = Selectable<NodeTextTable>;
export type CreateNodeText = Insertable<NodeTextTable>;
export type UpdateNodeText = Updateable<NodeTextTable>;

interface CollaborationTable {
  node_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  revision: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface DocumentTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<DocumentType, never, never>;
  local_revision: ColumnType<string, string, string>;
  server_revision: ColumnType<string, string, string>;
  content: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  updated_by: ColumnType<string | null, string | null, string | null>;
}

export type SelectDocument = Selectable<DocumentTable>;
export type CreateDocument = Insertable<DocumentTable>;
export type UpdateDocument = Updateable<DocumentTable>;

interface DocumentStateTable {
  id: ColumnType<string, string, never>;
  state: ColumnType<Uint8Array, Uint8Array, Uint8Array>;
  revision: ColumnType<string, string, string>;
}

export type SelectDocumentState = Selectable<DocumentStateTable>;
export type CreateDocumentState = Insertable<DocumentStateTable>;
export type UpdateDocumentState = Updateable<DocumentStateTable>;

interface DocumentUpdateTable {
  id: ColumnType<string, string, never>;
  document_id: ColumnType<string, string, never>;
  data: ColumnType<Uint8Array, Uint8Array, never>;
  created_at: ColumnType<string, string, never>;
}

export type SelectDocumentUpdate = Selectable<DocumentUpdateTable>;
export type CreateDocumentUpdate = Insertable<DocumentUpdateTable>;
export type UpdateDocumentUpdate = Updateable<DocumentUpdateTable>;

interface DocumentTextTable {
  id: ColumnType<string, string, never>;
  text: ColumnType<string | null, string | null, string | null>;
}

export type SelectDocumentText = Selectable<DocumentTextTable>;
export type CreateDocumentText = Insertable<DocumentTextTable>;
export type UpdateDocumentText = Updateable<DocumentTextTable>;

interface FileStateTable {
  id: ColumnType<string, string, never>;
  version: ColumnType<string, string, string>;
  download_status: ColumnType<
    DownloadStatus | null,
    DownloadStatus | null,
    DownloadStatus | null
  >;
  download_progress: ColumnType<number | null, number | null, number | null>;
  download_retries: ColumnType<number | null, number | null, number | null>;
  download_started_at: ColumnType<string | null, string | null, string | null>;
  download_completed_at: ColumnType<
    string | null,
    string | null,
    string | null
  >;
  upload_status: ColumnType<
    UploadStatus | null,
    UploadStatus | null,
    UploadStatus | null
  >;
  upload_progress: ColumnType<number | null, number | null, number | null>;
  upload_retries: ColumnType<number | null, number | null, number | null>;
  upload_started_at: ColumnType<string | null, string | null, string | null>;
  upload_completed_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectFileState = Selectable<FileStateTable>;
export type CreateFileState = Insertable<FileStateTable>;
export type UpdateFileState = Updateable<FileStateTable>;

interface MutationTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<MutationType, MutationType, never>;
  data: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  retries: ColumnType<number, number, number>;
}

export type SelectMutation = Selectable<MutationTable>;
export type CreateMutation = Insertable<MutationTable>;
export type UpdateMutation = Updateable<MutationTable>;

interface TombstoneTable {
  id: ColumnType<string, string, never>;
  data: ColumnType<string, string, never>;
  deleted_at: ColumnType<string, string, never>;
}

export type SelectTombsonte = Selectable<TombstoneTable>;
export type CreateTombstone = Insertable<TombstoneTable>;
export type UpdateTombstone = Updateable<TombstoneTable>;

interface CursorTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectCursor = Selectable<CursorTable>;
export type CreateCursor = Insertable<CursorTable>;
export type UpdateCursor = Updateable<CursorTable>;

interface MetadataTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectWorkspaceMetadata = Selectable<MetadataTable>;
export type CreateWorkspaceMetadata = Insertable<MetadataTable>;
export type UpdateWorkspaceMetadata = Updateable<MetadataTable>;

export interface WorkspaceDatabaseSchema {
  users: UserTable;
  nodes: NodeTable;
  node_states: NodeStateTable;
  node_interactions: NodeInteractionTable;
  node_updates: NodeUpdateTable;
  node_reactions: NodeReactionTable;
  node_references: NodeReferenceTable;
  node_counters: NodeCounterTable;
  node_texts: NodeTextTable;
  documents: DocumentTable;
  document_states: DocumentStateTable;
  document_updates: DocumentUpdateTable;
  document_texts: DocumentTextTable;
  collaborations: CollaborationTable;
  file_states: FileStateTable;
  mutations: MutationTable;
  tombstones: TombstoneTable;
  cursors: CursorTable;
  metadata: MetadataTable;
}
