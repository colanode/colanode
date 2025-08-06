import {
  generateId,
  IdType,
  generateFractionalIndex,
  getNodeModel,
  MessageAttributes,
} from '@colanode/core';
import { Mastra } from '@mastra/core';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { database } from '@colanode/server/data/database';
import { SelectNode } from '@colanode/server/data/schema';
import { JobHandler } from '@colanode/server/jobs';
import { assistantWorkflow } from '@colanode/server/lib/ai/ai-workflow';
import {
  AssistantWorkflowInput,
  AssistantWorkflowOutput,
} from '@colanode/server/types/ai';
import { config } from '@colanode/server/lib/config';
import { createNode, fetchNode } from '@colanode/server/lib/nodes';

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
    const startTime = Date.now();

    // Prepare request for the AI service
    const assistantRequest: AssistantWorkflowInput = {
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

    // Prepare runtime context
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('workspaceName', workspace.name || workspaceId);
    runtimeContext.set('userName', user.name || 'User');
    runtimeContext.set('userEmail', user.email || '');
    runtimeContext.set('workspaceId', workspaceId);
    runtimeContext.set('userId', user.id);
    runtimeContext.set('selectedContextNodeIds', selectedContextNodeIds || []);
    runtimeContext.set('userInput', messageText);

    // Initialize Mastra and get the workflow
    const mastra = new Mastra({
      workflows: {
        assistantWorkflow,
      },
    });
    const workflow = mastra.getWorkflow('assistantWorkflow');
    const run = await workflow.createRunAsync();

    // Execute the workflow
    const result = await run.start({
      inputData: assistantRequest,
      runtimeContext,
    });

    if (result.status !== 'success' || !result.result) {
      const errorMessage =
        result.status === 'suspended'
          ? 'Workflow was suspended unexpectedly'
          : (result as any).error || 'Workflow execution failed';
      console.error('❌ Workflow failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const assistantResult: AssistantWorkflowOutput = {
      ...result.result,
      processingTimeMs: Date.now() - startTime,
    };

    console.log(
      `✅ AI response generated (${assistantResult.processingTimeMs}ms): ${
        assistantResult.searchPerformed ? 'with search' : 'no search'
      }`
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
