import { redis, CHANNEL_NAMES } from '@/data/redis';
import { synapse } from '@/synapse';
import { ServerMutation } from '@/types/mutations';
import { MutationChangeData } from '@/types/changes';

export const initMutationsSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.MUTATIONS, handleMessage);
};

const handleMessage = async (message: string) => {
  const mutationData = JSON.parse(message) as MutationChangeData;
  if (!mutationData.device_ids || !mutationData.device_ids.length) {
    return;
  }

  const serverMutation: ServerMutation = {
    id: mutationData.id,
    action: mutationData.action as 'insert' | 'update' | 'delete',
    table: mutationData.table,
    workspaceId: mutationData.workspace_id,
    before: mutationData.before ? JSON.parse(mutationData.before) : null,
    after: mutationData.after ? JSON.parse(mutationData.after) : null,
  };

  for (const deviceId of mutationData.device_ids) {
    synapse.send(deviceId, {
      type: 'mutation',
      payload: serverMutation,
    });
  }
};