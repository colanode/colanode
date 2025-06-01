import {
  SelectAccountMetadata,
  SelectWorkspace,
} from '@colanode/client/databases/account';
import {
  SelectAccount,
  SelectAppMetadata,
  SelectServer,
} from '@colanode/client/databases/app';
import { SelectEmoji } from '@colanode/client/databases/emojis';
import { SelectIcon } from '@colanode/client/databases/icons';
import {
  SelectFileState,
  SelectMutation,
  SelectNode,
  SelectUser,
  SelectNodeInteraction,
  SelectNodeReaction,
  SelectWorkspaceMetadata,
  SelectDocument,
  SelectDocumentState,
  SelectDocumentUpdate,
  SelectNodeReference,
} from '@colanode/client/databases/workspace';
import {
  Account,
  AccountMetadata,
  AccountMetadataKey,
} from '@colanode/client/types/accounts';
import { AppMetadata, AppMetadataKey } from '@colanode/client/types/apps';
import {
  Document,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types/documents';
import { Emoji } from '@colanode/client/types/emojis';
import { FileState } from '@colanode/client/types/files';
import { Icon } from '@colanode/client/types/icons';
import {
  LocalNode,
  NodeInteraction,
  NodeReaction,
  NodeReference,
} from '@colanode/client/types/nodes';
import { Server } from '@colanode/client/types/servers';
import { User } from '@colanode/client/types/users';
import {
  Workspace,
  WorkspaceMetadata,
  WorkspaceMetadataKey,
} from '@colanode/client/types/workspaces';
import { Mutation } from '@colanode/core';

export const mapUser = (row: SelectUser): User => {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    customName: row.custom_name,
    customAvatar: row.custom_avatar,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapNode = (row: SelectNode): LocalNode => {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    rootId: row.root_id,
    attributes: JSON.parse(row.attributes),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    localRevision: row.local_revision,
    serverRevision: row.server_revision,
  } as LocalNode;
};

export const mapDocument = (row: SelectDocument): Document => {
  return {
    id: row.id,
    localRevision: row.local_revision,
    serverRevision: row.server_revision,
    content: JSON.parse(row.content),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
};

export const mapDocumentState = (row: SelectDocumentState): DocumentState => {
  return {
    id: row.id,
    revision: row.revision,
    state: row.state,
  };
};

export const mapDocumentUpdate = (
  row: SelectDocumentUpdate
): DocumentUpdate => {
  return {
    id: row.id,
    documentId: row.document_id,
    data: row.data,
  };
};

export const mapAccount = (row: SelectAccount): Account => {
  return {
    id: row.id,
    server: row.server,
    name: row.name,
    avatar: row.avatar,
    deviceId: row.device_id,
    email: row.email,
    token: row.token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
};

export const mapWorkspace = (row: SelectWorkspace): Workspace => {
  return {
    id: row.id,
    name: row.name,
    accountId: row.account_id,
    role: row.role,
    userId: row.user_id,
    avatar: row.avatar,
    description: row.description,
    maxFileSize: row.max_file_size,
    storageLimit: row.storage_limit,
  };
};

export const mapMutation = (row: SelectMutation): Mutation => {
  return {
    id: row.id,
    type: row.type,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
  };
};

export const mapServer = (row: SelectServer): Server => {
  return {
    domain: row.domain,
    name: row.name,
    avatar: row.avatar,
    attributes: JSON.parse(row.attributes),
    version: row.version,
    createdAt: new Date(row.created_at),
    syncedAt: row.synced_at ? new Date(row.synced_at) : null,
  };
};

export const mapNodeReaction = (row: SelectNodeReaction): NodeReaction => {
  return {
    nodeId: row.node_id,
    collaboratorId: row.collaborator_id,
    reaction: row.reaction,
    rootId: row.root_id,
    createdAt: row.created_at,
  };
};

export const mapNodeInteraction = (
  row: SelectNodeInteraction
): NodeInteraction => {
  return {
    nodeId: row.node_id,
    collaboratorId: row.collaborator_id,
    rootId: row.root_id,
    revision: row.revision,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    firstOpenedAt: row.first_opened_at,
    lastOpenedAt: row.last_opened_at,
  };
};

export const mapFileState = (row: SelectFileState): FileState => {
  return {
    id: row.id,
    version: row.version,
    downloadStatus: row.download_status,
    downloadProgress: row.download_progress,
    downloadRetries: row.download_retries,
    downloadStartedAt: row.download_started_at,
    downloadCompletedAt: row.download_completed_at,
    uploadStatus: row.upload_status,
    uploadProgress: row.upload_progress,
    uploadRetries: row.upload_retries,
    uploadStartedAt: row.upload_started_at,
    uploadCompletedAt: row.upload_completed_at,
  };
};

export const mapEmoji = (row: SelectEmoji): Emoji => {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    categoryId: row.category_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    emoticons: row.emoticons ? JSON.parse(row.emoticons) : [],
    skins: row.skins ? JSON.parse(row.skins) : [],
  };
};

export const mapIcon = (row: SelectIcon): Icon => {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    code: row.code,
    tags: row.tags ? JSON.parse(row.tags) : [],
  };
};

export const mapAppMetadata = (row: SelectAppMetadata): AppMetadata => {
  return {
    key: row.key as AppMetadataKey,
    value: JSON.parse(row.value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapAccountMetadata = (
  row: SelectAccountMetadata
): AccountMetadata => {
  return {
    key: row.key as AccountMetadataKey,
    value: JSON.parse(row.value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapWorkspaceMetadata = (
  row: SelectWorkspaceMetadata
): WorkspaceMetadata => {
  return {
    key: row.key as WorkspaceMetadataKey,
    value: JSON.parse(row.value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapNodeReference = (row: SelectNodeReference): NodeReference => {
  return {
    nodeId: row.node_id,
    referenceId: row.reference_id,
    innerId: row.inner_id,
    type: row.type,
  };
};
