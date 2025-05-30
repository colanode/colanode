import { WorkspaceRadarData } from '@colanode/client/types/radars';

export type RadarDataGetQueryInput = {
  type: 'radar_data_get';
};

export type RadarDataGetQueryOutput = Record<
  string,
  Record<string, WorkspaceRadarData>
>;

declare module '@colanode/client/queries' {
  interface QueryMap {
    radar_data_get: {
      input: RadarDataGetQueryInput;
      output: RadarDataGetQueryOutput;
    };
  }
}
