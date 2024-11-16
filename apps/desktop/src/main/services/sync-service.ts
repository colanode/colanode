import { accountService } from '@/main/services/account-service';
import { workspaceService } from '@/main/services/workspace-service';
import { deviceService } from '@/main/services/device-service';

// one minute
const EVENT_LOOP_INTERVAL = 1000 * 60;

class SyncService {
  private initiated: boolean = false;

  constructor() {
    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public init() {
    if (this.initiated) {
      return;
    }

    this.initiated = true;
    setTimeout(this.executeEventLoop, 10);
  }

  private async executeEventLoop() {
    try {
      await deviceService.checkOnlineState();
      if (deviceService.isOnline) {
        await accountService.syncAccounts();
        await accountService.syncDeletedTokens();
        await workspaceService.syncAllWorkspaces();
      }
    } catch (error) {
      console.log('error', error);
    }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }
}

export const syncService = new SyncService();
