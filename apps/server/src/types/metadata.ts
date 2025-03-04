export interface BaseMetadata {
  id: string;
  name?: string | null;
  createdAt: Date | null;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  author?: UserInfo;
  lastAuthor?: UserInfo;
  workspace?: WorkspaceInfo;
  parentContext?: ParentContextInfo;
  collaborators?: UserInfo[];
  databaseInfo?: DatabaseInfo;
}

export type NodeMetadata = BaseMetadata & {
  type: 'node';
  nodeType: string;
  fieldInfo?: Record<string, DatabaseFieldInfo>;
};

export type DocumentMetadata = BaseMetadata & {
  type: 'document';
};

export type ContextItem = {
  id: string;
  type: string;
};

export type UserInfo = {
  id: string;
  name: string;
};

export type WorkspaceInfo = {
  id: string;
  name: string;
};

export type ParentContextInfo = {
  id: string;
  type: string;
  name?: string | null;
  path: string;
};

export type DatabaseFieldInfo = {
  type: string;
  name: string;
};

export type DatabaseInfo = {
  id: string;
  name: string;
  fields: Record<string, DatabaseFieldInfo>;
};
