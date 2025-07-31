import {
  generateId,
  IdType,
  generateFractionalIndex,
  getNodeModel,
  MessageAttributes,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectNode } from '@colanode/server/data/schema';
import { JobHandler } from '@colanode/server/jobs';
import {
  processAIRequest,
  AssistantRequest,
} from '@colanode/server/lib/ai/ai-service';
import { config } from '@colanode/server/lib/config';
import { fetchNode, createNode } from '@colanode/server/lib/nodes';

interface Citation {
  sourceId: string;
  quote: string;
}

export type AssistantRespondInput = {
  type: 'assistant.respond';
  messageId: string;
  workspaceId: string;
  selectedContextNodeIds?: string[];
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'assistant.respond': {
      input: AssistantRespondInput;
    };
  }
}

export const assistantRespondHandler: JobHandler<
  AssistantRespondInput
> = async (input) => {
  const { messageId, workspaceId, selectedContextNodeIds } = input;
  console.log('Starting assistant response handler', {
    messageId,
    workspaceId,
    selectedContextNodeIds,
  });

  if (!config.ai.enabled) {
    return;
  }

  const message = await fetchNode(messageId);
  if (!message) {
    return;
  }

  const messageModel = getNodeModel(message.attributes.type);
  if (!messageModel) {
    return;
  }

  const messageText = messageModel.extractText(
    message.id,
    message.attributes
  )?.attributes;
  if (!messageText) {
    return;
  }

  const [user, workspace] = await Promise.all([
    database
      .selectFrom('users')
      .where('id', '=', message.created_by)
      .selectAll()
      .executeTakeFirst(),
    database
      .selectFrom('workspaces')
      .where('id', '=', workspaceId)
      .select(['name', 'id'])
      .executeTakeFirst(),
  ]);

  if (!user || !workspace) {
    return;
  }

  try {
    console.log(`🚀 Processing AI assistant request for message: ${messageId}`);

    // Prepare request for the AI service
    const assistantRequest: AssistantRequest = {
      userInput: messageText,
      workspaceId,
      userId: user.id,
      userDetails: {
        name: user.name || 'User',
        email: user.email || '',
      },
      parentMessageId: message.parent_id || message.id,
      currentMessageId: message.id,
      selectedContextNodeIds,
    };

    // Process the request through the AI service
    const assistantResult = await processAIRequest(assistantRequest);

    console.log(
      `✅ AI response generated (${assistantResult.processingTimeMs}ms): ${assistantResult.intent || 'unknown'} intent`
    );

    await createAndPublishResponse(
      assistantResult.finalAnswer,
      assistantResult.citations,
      message,
      workspaceId
    );

    console.log('📤 Response published successfully');
  } catch (error) {
    console.error('❌ Error in assistant response handler:', error);
    await createAndPublishResponse(
      'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
      [],
      message,
      workspaceId
    );
  }
};

const createAndPublishResponse = async (
  response: string,
  citations: Citation[] | undefined,
  originalMessage: SelectNode,
  workspaceId: string
) => {
  const id = generateId(IdType.Message);
  const blockId = generateId(IdType.Block);

  const messageAttributes: MessageAttributes = {
    type: 'message',
    subtype: 'answer',
    parentId: originalMessage.parent_id || originalMessage.id,
    content: {
      [blockId]: {
        id: blockId,
        type: 'paragraph',
        content: [{ type: 'text', text: response, marks: [] }],
        index: generateFractionalIndex(),
        parentId: id,
      },
      ...(citations?.reduce((acc, citation) => {
        const citationBlockId = generateId(IdType.Block);
        return {
          ...acc,
          [citationBlockId]: {
            id: citationBlockId,
            type: 'citation',
            content: [
              { type: 'text', text: citation.quote, marks: [] },
              { type: 'text', text: citation.sourceId, marks: [] },
            ],
            index: generateFractionalIndex(),
            parentId: id,
          },
        };
      }, {}) || {}),
    },
  };

  await createNode({
    nodeId: id,
    workspaceId,
    userId: 'colanode_ai',
    rootId: originalMessage.root_id,
    attributes: messageAttributes,
  });
};
