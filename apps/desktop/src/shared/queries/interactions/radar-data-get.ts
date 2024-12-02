import { WorkspaceRadarData } from '@/shared/types/radars';

export type RadarDataGetQueryInput = {
  type: 'radar_data_get';
};

declare module '@/shared/queries' {
  interface QueryMap {
    radar_data_get: {
      input: RadarDataGetQueryInput;
      output: Record<string, WorkspaceRadarData>;
    };
  }
}
