import {
  Account,
  Server,
  ServerState,
  SidebarMenuType,
  ThemeColor,
  ThemeMode,
  WindowSize,
  Workspace,
} from '@colanode/client/types';

export type AppStateQueryInput = {
  type: 'app.state';
};

export type AppServerState = Server & {
  state: ServerState;
};

export type AppAccountMetadata = {
  workspace?: string;
};

export type AppAccountState = Account & {
  isConnected: boolean;
  metadata: AppAccountMetadata;
  workspaces: Record<string, AppWorkspaceState>;
};

export type AppWorkspaceMetadata = {
  sidebarMenu?: SidebarMenuType;
  sidebarWidth?: number;
  location?: string;
};

export type AppWorkspaceState = Workspace & {
  metadata: AppWorkspaceMetadata;
};

export type AppMetadataState = {
  platform: string;
  version: string;
  windowSize?: WindowSize;
  account?: string;
  theme: {
    mode?: ThemeMode;
    color?: ThemeColor;
  };
};

export type AppStateOutput = {
  metadata: AppMetadataState;
  servers: Record<string, AppServerState>;
  accounts: Record<string, AppAccountState>;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'app.state': {
      input: AppStateQueryInput;
      output: AppStateOutput;
    };
  }
}
