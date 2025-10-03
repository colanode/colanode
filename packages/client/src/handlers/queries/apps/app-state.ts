import {
  mapAccountMetadata,
  mapTab,
  mapWorkspaceMetadata,
} from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  AppAccountMetadata,
  AppAccountState,
  AppMetadataState,
  AppStateOutput,
  AppStateQueryInput,
  AppWorkspaceMetadata,
  AppWorkspaceState,
} from '@colanode/client/queries/apps/app-state';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { Server, Tab } from '@colanode/client/types';
import { Event } from '@colanode/client/types/events';
import { build } from '@colanode/core';

export class AppStateQueryHandler implements QueryHandler<AppStateQueryInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(_: AppStateQueryInput): Promise<AppStateOutput> {
    const output = await this.getAppState();
    return output;
  }

  public async checkForChanges(
    event: Event,
    _: AppStateQueryInput,
    __: AppStateOutput
  ): Promise<ChangeCheckResult<AppStateQueryInput>> {
    if (event.type === 'app.metadata.updated') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'app.metadata.deleted') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.created') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.updated') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.deleted') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.metadata.updated') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.metadata.deleted') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.connection.closed') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'account.connection.opened') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'workspace.created') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'workspace.updated') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'workspace.deleted') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'workspace.metadata.updated') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'workspace.metadata.deleted') {
      const newOutput = await this.getAppState();
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async getAppState(): Promise<AppStateOutput> {
    const metadata = await this.buildAppMetadataState();
    const servers = this.buildServersState();
    const accounts = await this.buildAccountsState();
    const tabs = await this.buildTabsState();

    return {
      metadata,
      servers,
      accounts,
      tabs,
    };
  }

  private async buildAppMetadataState(): Promise<AppMetadataState> {
    const appMetadata = await this.app.metadata.getAll();

    const account = appMetadata.find(
      (metadata) => metadata.key === 'account'
    )?.value;

    const themeMode = appMetadata.find(
      (metadata) => metadata.key === 'theme.mode'
    )?.value;

    const themeColor = appMetadata.find(
      (metadata) => metadata.key === 'theme.color'
    )?.value;

    const platform = appMetadata.find(
      (metadata) => metadata.key === 'platform'
    )?.value;

    const version = appMetadata.find(
      (metadata) => metadata.key === 'version'
    )?.value;

    const windowSize = appMetadata.find(
      (metadata) => metadata.key === 'window.size'
    )?.value;

    const tab = appMetadata.find((metadata) => metadata.key === 'tab')?.value;

    return {
      account,
      theme: {
        mode: themeMode,
        color: themeColor,
      },
      platform: platform ?? '',
      version: version ?? build.version,
      windowSize,
      tab,
    };
  }

  private buildServersState(): Record<string, Server> {
    const servers = this.app.getServers();
    const output: Record<string, Server> = {};

    for (const server of servers) {
      output[server.server.domain] = server.server;
    }

    return output;
  }

  private async buildAccountsState(): Promise<Record<string, AppAccountState>> {
    const accounts = this.app.getAccounts();
    const output: Record<string, AppAccountState> = {};

    for (const account of accounts) {
      const metadata = await this.buildAccountMetadata(account);
      const workspaces = await this.buildAccountWorkspaces(account);

      const accountState: AppAccountState = {
        ...account.account,
        isConnected: account.socket.isConnected(),
        metadata,
        workspaces,
      };

      output[account.account.id] = accountState;
    }

    return output;
  }

  private async buildAccountMetadata(
    account: AccountService
  ): Promise<AppAccountMetadata> {
    const rows = await account.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    const metadata = rows.map(mapAccountMetadata);

    const workspace = metadata.find(
      (metadata) => metadata.key === 'workspace'
    )?.value;

    return {
      workspace,
    };
  }

  private async buildAccountWorkspaces(
    account: AccountService
  ): Promise<Record<string, AppWorkspaceState>> {
    const workspaces = account.getWorkspaces();
    const output: Record<string, AppWorkspaceState> = {};

    for (const workspace of workspaces) {
      const metadata = await this.buildWorkspaceMetadata(workspace);

      const workspaceState: AppWorkspaceState = {
        ...workspace.workspace,
        metadata,
      };

      output[workspace.workspace.id] = workspaceState;
    }

    return output;
  }

  private async buildWorkspaceMetadata(
    workspace: WorkspaceService
  ): Promise<AppWorkspaceMetadata> {
    const rows = await workspace.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    const metadata = rows.map(mapWorkspaceMetadata);

    const sidebarWidth = metadata.find(
      (metadata) => metadata.key === 'sidebar.width'
    )?.value;

    const location = metadata.find(
      (metadata) => metadata.key === 'location'
    )?.value;

    return {
      sidebarWidth,
      location,
    };
  }

  private async buildTabsState(): Promise<Record<string, Tab>> {
    const tabs = await this.app.database
      .selectFrom('tabs')
      .selectAll()
      .execute();

    const output: Record<string, Tab> = {};

    for (const tab of tabs) {
      output[tab.id] = mapTab(tab);
    }

    return output;
  }
}
