import { app } from 'electron';
import { eventBus } from '@/shared/lib/event-bus';
import { radarService } from '@/main/services/radar-service';

class NotificationService {
  constructor() {
    if (process.platform !== 'darwin') {
      return;
    }

    eventBus.subscribe((event) => {
      if (event.type === 'radar_data_updated') {
        this.checkBadge();
      }
    });
  }

  public init() {
    this.checkBadge();
  }

  public checkBadge() {
    if (process.platform !== 'darwin') {
      return;
    }

    const radarData = radarService.getData();
    const importantCount = Object.values(radarData).reduce(
      (acc, curr) => acc + curr.importantCount,
      0
    );
    const hasUnseenChanges = Object.values(radarData).some(
      (data) => data.hasUnseenChanges
    );

    if (importantCount > 0) {
      app.dock.setBadge(importantCount.toString());
    } else if (hasUnseenChanges) {
      app.dock.setBadge('·');
    } else {
      app.dock.setBadge('');
    }
  }
}

export const notificationService = new NotificationService();
