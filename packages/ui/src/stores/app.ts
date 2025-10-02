import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { AppStateOutput } from '@colanode/client/queries';
import {
  Account,
  AccountMetadata,
  AccountMetadataKey,
  AppMetadata,
  AppMetadataKey,
  AppTab,
  Server,
  ServerState,
  SidebarMenuType,
  ThemeColor,
  ThemeMode,
  WindowSize,
  Workspace,
  WorkspaceMetadata,
} from '@colanode/client/types';

interface AppStore extends AppStateOutput {
  initialized: boolean;
  initialize: (appState: AppStateOutput) => void;
  updateAppMetadata: (metadata: Pick<AppMetadata, 'key' | 'value'>) => void;
  deleteAppMetadata: (key: AppMetadataKey) => void;
  upsertAccount: (account: Account) => void;
  deleteAccount: (accountId: string) => void;
  updateAccountConnection: (accountId: string, isConnected: boolean) => void;
  updateAccountMetadata: (
    accountId: string,
    metadata: Pick<AccountMetadata, 'key' | 'value'>
  ) => void;
  deleteAccountMetadata: (accountId: string, key: AccountMetadataKey) => void;
  upsertWorkspace: (workspace: Workspace) => void;
  deleteWorkspace: (accountId: string, workspaceId: string) => void;
  updateWorkspaceMetadata: (
    accountId: string,
    workspaceId: string,
    metadata: Pick<WorkspaceMetadata, 'key' | 'value'>
  ) => void;
  deleteWorkspaceMetadata: (
    accountId: string,
    workspaceId: string,
    key: string
  ) => void;
  upsertServer: (server: Server) => void;
  deleteServer: (domain: string) => void;
  updateServerState: (domain: string, state: ServerState) => void;
}

export const useAppStore = create<AppStore>()(
  immer((set) => ({
    initialized: false,
    metadata: {
      platform: '',
      version: '',
      theme: {},
      tabs: [],
    },
    servers: {},
    accounts: {},
    initialize: (appState) => set({ ...appState, initialized: true }),
    updateAppMetadata: (metadata) =>
      set((state) => {
        if (metadata.key === 'platform') {
          state.metadata.platform = metadata.value as string;
        } else if (metadata.key === 'version') {
          state.metadata.version = metadata.value as string;
        } else if (metadata.key === 'theme.color') {
          state.metadata.theme.color = metadata.value as ThemeColor;
        } else if (metadata.key === 'theme.mode') {
          state.metadata.theme.mode = metadata.value as ThemeMode;
        } else if (metadata.key === 'account') {
          state.metadata.account = metadata.value as string;
        } else if (metadata.key === 'window.size') {
          state.metadata.windowSize = metadata.value as WindowSize;
        } else if (metadata.key === 'tabs') {
          state.metadata.tabs = metadata.value as AppTab[];
        }
      }),
    deleteAppMetadata: (key) =>
      set((state) => {
        if (key === 'theme.color') {
          state.metadata.theme.color = undefined;
        } else if (key === 'theme.mode') {
          state.metadata.theme.mode = undefined;
        } else if (key === 'account') {
          state.metadata.account = undefined;
        } else if (key === 'window.size') {
          state.metadata.windowSize = undefined;
        } else if (key === 'tabs') {
          state.metadata.tabs = [];
        }
      }),
    upsertAccount: (account) =>
      set((state) => {
        const existingAccount = state.accounts[account.id];
        if (existingAccount) {
          state.accounts[account.id] = { ...existingAccount, ...account };
        } else {
          state.accounts[account.id] = {
            ...account,
            isConnected: false,
            metadata: {},
            workspaces: {},
          };
        }
      }),
    deleteAccount: (accountId) =>
      set((state) => {
        const { accounts } = state;
        delete accounts[accountId];
      }),
    updateAccountConnection: (accountId, isConnected) =>
      set((state) => {
        const account = state.accounts[accountId];
        if (!account) {
          return;
        }

        account.isConnected = isConnected;
      }),
    updateAccountMetadata: (accountId, metadata) =>
      set((state) => {
        const account = state.accounts[accountId];
        if (!account) {
          return;
        }

        if (metadata.key === 'workspace') {
          account.metadata.workspace = metadata.value as string;
        }
      }),
    deleteAccountMetadata: (accountId, key) =>
      set((state) => {
        const account = state.accounts[accountId];
        if (!account) {
          return;
        }

        if (key === 'workspace') {
          account.metadata.workspace = undefined;
        }
      }),
    upsertWorkspace: (workspace) =>
      set((state) => {
        const account = state.accounts[workspace.accountId];
        if (!account) {
          return;
        }

        const existingWorkspace = account.workspaces[workspace.id];
        if (existingWorkspace) {
          account.workspaces[workspace.id] = {
            ...existingWorkspace,
            ...workspace,
          };
        } else {
          account.workspaces[workspace.id] = {
            ...workspace,
            metadata: {},
          };
        }
      }),
    deleteWorkspace: (accountId, workspaceId) =>
      set((state) => {
        const account = state.accounts[accountId];
        if (!account) {
          return;
        }

        delete account.workspaces[workspaceId];
      }),
    updateWorkspaceMetadata: (accountId, workspaceId, metadata) =>
      set((state) => {
        const account = state.accounts[accountId];
        if (!account) {
          return;
        }

        const existingWorkspace = account.workspaces[workspaceId];
        if (!existingWorkspace) {
          return;
        }

        if (metadata.key === 'sidebar.width') {
          existingWorkspace.metadata.sidebarWidth = metadata.value as number;
        } else if (metadata.key === 'sidebar.menu') {
          existingWorkspace.metadata.sidebarMenu =
            metadata.value as SidebarMenuType;
        } else if (metadata.key === 'location') {
          existingWorkspace.metadata.location = metadata.value as string;
        }
      }),
    deleteWorkspaceMetadata: (accountId, workspaceId, key) =>
      set((state) => {
        const account = state.accounts[accountId];
        if (!account) {
          return;
        }

        const existingWorkspace = account.workspaces[workspaceId];
        if (!existingWorkspace) {
          return;
        }

        const existingMetadata = { ...existingWorkspace.metadata };
        if (key === 'sidebar.width') {
          existingMetadata.sidebarWidth = undefined;
        } else if (key === 'sidebar.menu') {
          existingMetadata.sidebarMenu = undefined;
        } else if (key === 'location') {
          existingMetadata.location = undefined;
        }
      }),
    upsertServer: (server) =>
      set((state) => {
        state.servers[server.domain] = server;
      }),
    deleteServer: (domain) =>
      set((state) => {
        const { servers } = state;
        delete servers[domain];
      }),
    updateServerState: (domain, serverState) =>
      set((state) => {
        const server = state.servers[domain];
        if (!server) {
          return;
        }

        server.state = serverState;
      }),
  }))
);
