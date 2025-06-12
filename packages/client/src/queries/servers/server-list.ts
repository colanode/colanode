import { ServerDetails } from '@colanode/client/types/servers';

export type ServerListQueryInput = {
  type: 'server.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'server.list': {
      input: ServerListQueryInput;
      output: ServerDetails[];
    };
  }
}
