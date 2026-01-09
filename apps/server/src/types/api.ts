import { WorkspaceRole, WorkspaceStatus } from '@colanode/core';

export type AccountContext = {
  id: string;
  deviceId: string;
};

export type WorkspaceContext = {
  id: string;
  maxFileSize?: string | null;
  status: WorkspaceStatus;
  user: {
    id: string;
    accountId: string;
    role: WorkspaceRole;
  };
};

export type ClientType = 'web' | 'desktop';

export type ClientContext = {
  ip: string;
  platform: string;
  version: string;
  type: ClientType;
};
