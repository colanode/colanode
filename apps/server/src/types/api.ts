export type RequestAccount = {
  id: string;
  deviceId: string;
};

export type ClientType = 'web' | 'desktop';

export type ClientContext = {
  ip: string;
  platform: string;
  version: string;
  type: ClientType;
};
