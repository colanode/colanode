import { databaseService } from '@/main/data/database-service';
import { createLogger } from '@/main/logger';
import { accountService } from '@/main/services/account-service';
import { assetService } from '@/main/services/asset-service';
import { fileService } from '@/main/services/file-service';
import { notificationService } from '@/main/services/notification-service';
import { radarService } from '@/main/services/radar-service';
import { serverService } from '@/main/services/server-service';
import { socketService } from '@/main/services/socket-service';
import { syncService } from '@/main/services/sync-service';

// one minute
const EVENT_LOOP_INTERVAL = 1000 * 60;

class Bootstrapper {
  private readonly logger = createLogger('bootstrapper');
  private initPromise: Promise<void> | null = null;
  private eventLoop: NodeJS.Timeout | null = null;

  constructor() {
    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    return this.initPromise;
  }

  private async executeInit() {
    this.logger.info('Initializing');

    await databaseService.init();
    await assetService.checkAssets();
    await serverService.syncServers();
    await radarService.init();
    await socketService.checkConnections();
    notificationService.init();

    if (!this.eventLoop) {
      this.eventLoop = setTimeout(this.executeEventLoop, 50);
    }
  }

  private async executeEventLoop() {
    this.logger.info('Executing event loop');

    try {
      await serverService.syncServers();
      await accountService.syncAccounts();
      await socketService.checkConnections();
      await syncService.syncAllWorkspaces();
      await fileService.syncFiles();

      notificationService.checkBadge();
    } catch (error) {
      this.logger.error(error, 'Error executing event loop');
    }

    this.eventLoop = setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }
}

export const bootstrapper = new Bootstrapper();
