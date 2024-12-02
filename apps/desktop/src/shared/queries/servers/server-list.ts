import { Server } from '@/shared/types/servers';

export type ServerListQueryInput = {
  type: 'server_list';
};

declare module '@/shared/queries' {
  interface QueryMap {
    server_list: {
      input: ServerListQueryInput;
      output: Server[];
    };
  }
}
