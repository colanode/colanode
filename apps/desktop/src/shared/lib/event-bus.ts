import { Event } from '@/shared/types/events';

export interface Subscription {
  id: string;
  callback: (event: Event) => void | Promise<void>;
}

export interface EventBus {
  subscribe(callback: (event: Event) => void): string;
  unsubscribe(subscriptionId: string): void;
  publish(event: Event): void;
}

interface EventPromise {
  event: Event;
  resolve: () => void;
  reject: (error: any) => void;
}

export class EventBusService {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventQueue: EventPromise[] = [];
  private isProcessing = false;
  private id = 0;

  public subscribe(callback: (event: Event) => void | Promise<void>): string {
    const id = (this.id++).toString();
    this.subscriptions.set(id, {
      callback,
      id,
    });
    return id;
  }

  public unsubscribe(subscriptionId: string) {
    this.subscriptions.delete(subscriptionId);
  }

  public publish(event: Event): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.eventQueue.push({ event, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    while (this.eventQueue.length > 0) {
      const { event, resolve, reject } = this.eventQueue.shift()!;
      try {
        // Process the event by calling all subscribers
        for (const subscription of this.subscriptions.values()) {
          await subscription.callback(event);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    }
    this.isProcessing = false;
  }
}

export const eventBus = new EventBusService();
