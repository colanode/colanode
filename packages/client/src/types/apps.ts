export type AppType = 'desktop' | 'web' | 'mobile';

export type WindowState = {
  fullscreen: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
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
