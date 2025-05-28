export interface AppBuild {
  version: string;
  sha: string;
  type: 'desktop' | 'web';
  platform: string;
}
