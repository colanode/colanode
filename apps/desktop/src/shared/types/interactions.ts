import { InteractionAttributes } from '@colanode/core';

export type Interaction = {
  nodeId: string;
  userId: string;
  attributes: InteractionAttributes;
  createdAt: Date;
  updatedAt: Date | null;
  serverCreatedAt: Date | null;
  serverUpdatedAt: Date | null;
  version: bigint | null;
};
