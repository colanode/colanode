export type AppType = 'desktop' | 'web' | 'mobile';

export type WindowSize = {
  width: number;
  height: number;
  fullscreen: boolean;
};

export type Metadata = {
  namespace: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string | null;
};

export type Tab = {
  id: string;
  location: string;
  index: string;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string | null;
};
