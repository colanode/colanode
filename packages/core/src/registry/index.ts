import { ChannelAttributes, channelModel } from './channel';
import { NodeModel } from './core';
import { PageAttributes, pageModel } from './page';
import { ChatAttributes, chatModel } from './chat';
import { SpaceAttributes, spaceModel } from './space';
import { UserAttributes, userModel } from './user';
import { MessageAttributes, messageModel } from './message';
import { DatabaseAttributes, databaseModel } from './database';
import { FileAttributes, fileModel } from './file';
import { FolderAttributes, folderModel } from './folder';
import { RecordAttributes, recordModel } from './record';
import { WorkspaceAttributes, workspaceModel } from './workspace';

type NodeBase = {
  id: string;
  parentId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
  serverVersionId: string | null;
};

export type ChannelNode = NodeBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChatNode = NodeBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type DatabaseNode = NodeBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type FileNode = NodeBase & {
  type: 'file';
  attributes: FileAttributes;
};

export type FolderNode = NodeBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type MessageNode = NodeBase & {
  type: 'message';
  attributes: MessageAttributes;
};

export type PageNode = NodeBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type RecordNode = NodeBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type SpaceNode = NodeBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type UserNode = NodeBase & {
  type: 'user';
  attributes: UserAttributes;
};

export type WorkspaceNode = NodeBase & {
  type: 'workspace';
  attributes: WorkspaceAttributes;
};

export type NodeType =
  | 'channel'
  | 'chat'
  | 'database'
  | 'file'
  | 'folder'
  | 'message'
  | 'page'
  | 'record'
  | 'space'
  | 'user'
  | 'workspace';

export type Node =
  | ChannelNode
  | ChatNode
  | DatabaseNode
  | FileNode
  | FolderNode
  | MessageNode
  | PageNode
  | RecordNode
  | SpaceNode
  | UserNode
  | WorkspaceNode;

export type NodeAttributes =
  | UserAttributes
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FileAttributes
  | FolderAttributes
  | MessageAttributes
  | PageAttributes
  | RecordAttributes
  | WorkspaceAttributes;

class Registry {
  private models: Map<string, NodeModel> = new Map();

  constructor() {
    this.models.set('channel', channelModel);
    this.models.set('chat', chatModel);
    this.models.set('database', databaseModel);
    this.models.set('file', fileModel);
    this.models.set('folder', folderModel);
    this.models.set('message', messageModel);
    this.models.set('page', pageModel);
    this.models.set('record', recordModel);
    this.models.set('space', spaceModel);
    this.models.set('user', userModel);
    this.models.set('workspace', workspaceModel);
  }

  getModel(type: string): NodeModel {
    const model = this.models.get(type);
    if (!model) {
      throw new Error(`Model for type ${type} not found`);
    }

    return model;
  }
}

export const registry = new Registry();
