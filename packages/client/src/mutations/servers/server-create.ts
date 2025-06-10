import { Server } from '@colanode/client/types/servers';

export type ServerCreateMutationInput = {
  type: 'server.create';
  url: string;
};

export type ServerCreateMutationOutput = {
  server: Server;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'server.create': {
      input: ServerCreateMutationInput;
      output: ServerCreateMutationOutput;
    };
  }
}
