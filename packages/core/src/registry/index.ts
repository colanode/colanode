import { ChannelAttributes, channelModel } from './channel';
import { ChatAttributes, chatModel } from './chat';
import { NodeModel } from './core';
import { DatabaseAttributes, databaseModel } from './database';
import { FileAttributes, fileModel } from './file';
import { FolderAttributes, folderModel } from './folder';
import { MessageAttributes, messageModel } from './message';
import { PageAttributes, pageModel } from './page';
import { RecordAttributes, recordModel } from './record';
import { SpaceAttributes, spaceModel } from './space';
import { UserAttributes, userModel } from './user';
import { WorkspaceAttributes, workspaceModel } from './workspace';

type NodeBase = {
  id: string;
  parentId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  transactionId: string;
};

export type CollaborationBase = {
  userId: string;
  nodeId: string;
  type: NodeType;
  createdAt: string;
  createdBy: string | null;
  removedAt: string | null;
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
