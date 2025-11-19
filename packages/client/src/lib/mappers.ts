import {
  SelectAvatar,
  SelectWorkspace,
  SelectAccount,
  SelectMetadata,
  SelectTab,
  SelectTempFile,
} from '@colanode/client/databases/app';
import { SelectEmoji } from '@colanode/client/databases/emojis';
import { SelectIcon } from '@colanode/client/databases/icons';
import {
  SelectMutation,
  SelectNode,
  SelectUser,
  SelectNodeInteraction,
  SelectNodeReaction,
  SelectDocument,
  SelectDocumentState,
  SelectDocumentUpdate,
  SelectNodeReference,
  SelectLocalFile,
  SelectDownload,
  SelectUpload,
} from '@colanode/client/databases/workspace';
import { Account } from '@colanode/client/types/accounts';
import { Metadata, Tab } from '@colanode/client/types/apps';
import { Avatar } from '@colanode/client/types/avatars';
import {
  Document,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types/documents';
import { Emoji } from '@colanode/client/types/emojis';
import {
  LocalFile,
  Download,
  Upload,
  TempFile,
} from '@colanode/client/types/files';
import { Icon } from '@colanode/client/types/icons';
import {
  LocalNode,
  NodeInteraction,
  NodeReaction,
  NodeReference,
} from '@colanode/client/types/nodes';
import { User } from '@colanode/client/types/users';
import { Workspace } from '@colanode/client/types/workspaces';
import { Mutation } from '@colanode/core';
import { encodeState } from '@colanode/crdt';

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
    state: encodeState(row.state),
  };
};

export const mapDocumentUpdate = (
  row: SelectDocumentUpdate
): DocumentUpdate => {
  return {
    id: row.id,
    documentId: row.document_id,
    data: encodeState(row.data),
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
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    accountId: row.account_id,
    role: row.role,
    avatar: row.avatar,
    description: row.description,
    maxFileSize: row.max_file_size.toString(),
    storageLimit: row.storage_limit.toString(),
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

export const mapLocalFile = (
  row: SelectLocalFile,
  url: string | null
): LocalFile => {
  return {
    id: row.id,
    version: row.version,
    path: row.path,
    openedAt: row.opened_at,
    downloadStatus: row.download_status,
    downloadProgress: row.download_progress,
    downloadRetries: row.download_retries,
    downloadCompletedAt: row.download_completed_at,
    downloadErrorCode: row.download_error_code,
    downloadErrorMessage: row.download_error_message,
    createdAt: row.created_at,
    url,
  };
};

export const mapTempFile = (row: SelectTempFile, url: string): TempFile => {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    size: row.size,
    subtype: row.subtype,
    mimeType: row.mime_type,
    extension: row.extension,
    url,
  };
};

export const mapDownload = (row: SelectDownload): Download => {
  return {
    id: row.id,
    fileId: row.file_id,
    version: row.version,
    name: row.name,
    path: row.path,
    size: row.size,
    mimeType: row.mime_type,
    status: row.status,
    progress: row.progress,
    retries: row.retries,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  };
};

export const mapUpload = (row: SelectUpload): Upload => {
  return {
    fileId: row.file_id,
    status: row.status,
    progress: row.progress,
    retries: row.retries,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
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

export const mapMetadata = (row: SelectMetadata): Metadata => {
  return {
    namespace: row.namespace,
    key: row.key,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapTab = (row: SelectTab): Tab => {
  return {
    id: row.id,
    location: row.location,
    index: row.index,
    lastActiveAt: row.last_active_at,
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

export const mapAvatar = (row: SelectAvatar, url: string): Avatar => {
  return {
    id: row.id,
    path: row.path,
    size: row.size,
    createdAt: row.created_at,
    openedAt: row.opened_at,
    url,
  };
};
