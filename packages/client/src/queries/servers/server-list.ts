import { Server } from '@colanode/client/types/servers';

export type ServerListQueryInput = {
  type: 'server_list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    server_list: {
      input: ServerListQueryInput;
      output: Server[];
    };
  }
}
