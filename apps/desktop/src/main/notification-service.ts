import { eventBus } from '@colanode/client/lib';
import { AppService } from '@colanode/client/services';

import { app } from 'electron';

export class NotificationService {
  private readonly appService: AppService;

  constructor(appService: AppService) {
    this.appService = appService;

    if (process.platform !== 'darwin') {
      return;
    }

    eventBus.subscribe((event) => {
      if (event.type === 'radar_data_updated') {
        this.checkBadge();
      } else if (event.type === 'workspace_deleted') {
        this.checkBadge();
      } else if (event.type === 'account_deleted') {
        this.checkBadge();
      }
    });
  }

  public checkBadge() {
    if (process.platform !== 'darwin') {
      return;
    }

    const accounts = this.appService.getAccounts();
    if (accounts.length === 0) {
      app.dock.setBadge('');
      return;
    }

    let hasUnread = false;
    let unreadCount = 0;

    for (const account of accounts) {
      const workspaces = account.getWorkspaces();

      for (const workspace of workspaces) {
        const radarData = workspace.radar.getData();
        hasUnread = hasUnread || radarData.state.hasUnread;
        unreadCount = unreadCount + radarData.state.unreadCount;
      }
    }

    if (unreadCount > 0) {
      app.dock.setBadge(unreadCount.toString());
    } else if (hasUnread) {
      app.dock.setBadge('·');
    } else {
      app.dock.setBadge('');
    }
  }
}
