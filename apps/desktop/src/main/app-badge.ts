import { app as electronApp } from 'electron';

import { eventBus } from '@colanode/client/lib';
import { AppService } from '@colanode/client/services';

export class AppBadge {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public init() {
    if (process.platform !== 'darwin') {
      return;
    }

    eventBus.subscribe((event) => {
      if (event.type === 'radar.data.updated') {
        this.checkBadge();
      } else if (event.type === 'workspace.deleted') {
        this.checkBadge();
      } else if (event.type === 'account.deleted') {
        this.checkBadge();
      }
    });
  }

  private checkBadge() {
    if (process.platform !== 'darwin') {
      return;
    }

    const workspaces = this.app.getWorkspaces();
    if (workspaces.length === 0) {
      electronApp?.dock?.setBadge('');
      return;
    }

    let hasUnread = false;
    let unreadCount = 0;

    for (const workspace of workspaces) {
      const radarData = workspace.radar.getData();
      hasUnread = hasUnread || radarData.state.hasUnread;
      unreadCount = unreadCount + radarData.state.unreadCount;
    }

    if (unreadCount > 0) {
      electronApp?.dock?.setBadge(unreadCount.toString());
    } else if (hasUnread) {
      electronApp?.dock?.setBadge('·');
    } else {
      electronApp?.dock?.setBadge('');
    }
  }
}
