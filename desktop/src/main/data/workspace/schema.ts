import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface NodeTable {
  id: ColumnType<string, string, never>;
  parent_id: ColumnType<string | null, never, never>;
  type: ColumnType<string, never, never>;
  index: ColumnType<string | null, never, never>;
  attributes: ColumnType<string, string, string>;
  state: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  server_version_id: ColumnType<string | null, string | null, string | null>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeCollaboratorTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  server_version_id: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeCollaborator = Selectable<NodeCollaboratorTable>;
export type CreateNodeCollaborator = Insertable<NodeCollaboratorTable>;
export type UpdateNodeCollaborator = Updateable<NodeCollaboratorTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  actor_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface ChangeTable {
  id: ColumnType<number, never, never>;
  table: ColumnType<string, string, never>;
  action: ColumnType<string, string, never>;
  before: ColumnType<string | null, string | null, never>;
  after: ColumnType<string | null, string | null, never>;
  created_at: ColumnType<string, string, never>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectChange = Selectable<ChangeTable>;
export type CreateChange = Insertable<ChangeTable>;
export type UpdateChange = Updateable<ChangeTable>;

export interface WorkspaceDatabaseSchema {
  nodes: NodeTable;
  changes: ChangeTable;
  node_collaborators: NodeCollaboratorTable;
  node_reactions: NodeReactionTable;
}