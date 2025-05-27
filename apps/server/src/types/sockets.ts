import { ClientContext } from '@colanode/server/types/api';

export type SocketContext = {
  id: string;
  accountId: string;
  deviceId: string;
  client: ClientContext;
};
