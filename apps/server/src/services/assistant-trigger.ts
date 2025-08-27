import { eventBus } from '@colanode/server/lib/event-bus';
import { fetchNode } from '@colanode/server/lib/nodes';
import { createLogger } from '@colanode/server/lib/logger';
import { jobService } from '@colanode/server/services/job-service';

const logger = createLogger('server:service:assistant-trigger');

export const initAssistantTrigger = () => {
  eventBus.subscribe(async (event) => {
    if (event.type !== 'node.created') {
      return;
    }

    try {
      const node = await fetchNode(event.nodeId);
      if (!node) {
        return;
      }

      const attributes = node.attributes as {
        type?: string;
        subtype?: string;
      } | null;
      if (
        attributes?.type === 'message' &&
        attributes?.subtype === 'question'
      ) {
        await jobService.addJob({
          type: 'assistant.respond',
          messageId: node.id,
          workspaceId: event.workspaceId,
        });

        logger.debug(
          `Queued assistant response for question message ${node.id} (workspace ${event.workspaceId})`
        );
      }
    } catch (error) {
      logger.error(error, 'Failed handling node.created for assistant trigger');
    }
  });
};
