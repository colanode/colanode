import { eventBus } from '@/shared/lib/event-bus';
// import { publicIp } from 'public-ip';

type OnlineState = {
  isOnline: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

class DeviceService {
  private readonly onlineState: OnlineState = {
    isOnline: false,
    lastCheckedAt: new Date(),
    lastCheckedSuccessfullyAt: null,
    count: 0,
  };

  private deviceIp: string | null = null;

  public get isOnline() {
    return this.onlineState.isOnline;
  }

  public get ip() {
    return this.deviceIp;
  }

  public async checkOnlineState() {
    const wasOnline = this.onlineState.isOnline;
    const isOnline = await this.checkIsOnline();

    this.onlineState.isOnline = isOnline;
    this.onlineState.lastCheckedAt = new Date();
    this.onlineState.count++;
    if (isOnline) {
      this.onlineState.lastCheckedSuccessfullyAt = new Date();
    }

    if (wasOnline !== isOnline) {
      eventBus.publish({
        type: 'online_state_changed',
        isOnline,
      });
    }
  }

  private async checkIsOnline() {
    try {
      // this.deviceIp = await publicIp();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const deviceService = new DeviceService();
