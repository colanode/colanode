import { Server } from '../../types/servers';

export type ServerCreateMutationInput = {
  type: 'server_create';
  domain: string;
};

export type ServerCreateMutationOutput = {
  server: Server;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    server_create: {
      input: ServerCreateMutationInput;
      output: ServerCreateMutationOutput;
    };
  }
}
