import {
  CanUpdateDocumentContext,
  DocumentContent,
  generateId,
  getNodeModel,
  IdType,
  MutationStatus,
  UpdateDocumentMutationData,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import { SelectUser } from '@colanode/server/data/schema';
import { scheduleDocumentEmbedding } from '@colanode/server/lib/ai/embeddings';
import { eventBus } from '@colanode/server/lib/event-bus';
import { createLogger } from '@colanode/server/lib/logger';
import { fetchNode, fetchNodeTree, mapNode } from '@colanode/server/lib/nodes';
import {
  CreateDocumentInput,
  CreateDocumentOutput,
} from '@colanode/server/types/documents';
import { ConcurrentUpdateResult } from '@colanode/server/types/nodes';

const logger = createLogger('server:lib:documents');

const UPDATE_RETRIES_LIMIT = 10;

export const createDocument = async (
  input: CreateDocumentInput
): Promise<CreateDocumentOutput | null> => {
  const node = await fetchNode(input.nodeId);
  if (!node) {
    return null;
  }

  const model = getNodeModel(node.type);
  if (!model.documentSchema) {
    return null;
  }

  const ydoc = new YDoc();
  const update = ydoc.update(model.documentSchema, input.content);
  if (!update) {
    return null;
  }

  const content = ydoc.getObject<DocumentContent>();

  const { createdDocument, createdDocumentUpdate } = await database
    .transaction()
    .execute(async (trx) => {
      const createdDocumentUpdate = await trx
        .insertInto('document_updates')
        .returningAll()
        .values({
          id: generateId(IdType.Update),
          document_id: input.nodeId,
          workspace_id: input.workspaceId,
          root_id: node.root_id,
          data: update,
          created_at: new Date(),
          created_by: input.userId,
        })
        .executeTakeFirst();

      if (!createdDocumentUpdate) {
        throw new Error('Failed to create document update');
      }

      const createdDocument = await trx
        .insertInto('documents')
        .returningAll()
        .values({
          id: input.nodeId,
          workspace_id: input.workspaceId,
          content: JSON.stringify(content),
          created_at: new Date(),
          created_by: input.userId,
          revision: createdDocumentUpdate.revision,
        })
        .executeTakeFirst();

      if (!createdDocument) {
        throw new Error('Failed to create document');
      }

      return {
        createdDocument,
        createdDocumentUpdate,
      };
    });

  if (!createdDocument || !createdDocumentUpdate) {
    return null;
  }

  eventBus.publish({
    type: 'document.updated',
    documentId: input.nodeId,
    workspaceId: input.workspaceId,
  });

  eventBus.publish({
    type: 'document.update.created',
    documentId: input.nodeId,
    rootId: node.root_id,
    workspaceId: input.workspaceId,
  });

  return {
    document: createdDocument,
  };
};

export const updateDocumentFromMutation = async (
  user: SelectUser,
  mutation: UpdateDocumentMutationData
): Promise<MutationStatus> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const existingDocumentUpdate = await database
      .selectFrom('document_updates')
      .where('id', '=', mutation.updateId)
      .selectAll()
      .executeTakeFirst();

    if (existingDocumentUpdate) {
      return MutationStatus.OK;
    }

    const result = await tryUpdateDocumentFromMutation(user, mutation);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return MutationStatus.INTERNAL_SERVER_ERROR;
    }
  }

  return MutationStatus.INTERNAL_SERVER_ERROR;
};

const tryUpdateDocumentFromMutation = async (
  user: SelectUser,
  mutation: UpdateDocumentMutationData
): Promise<ConcurrentUpdateResult<MutationStatus>> => {
  const tree = await fetchNodeTree(mutation.documentId);
  if (tree.length === 0) {
    return { type: 'success', output: MutationStatus.NOT_FOUND };
  }

  const node = tree[tree.length - 1];
  if (!node) {
    return { type: 'success', output: MutationStatus.NOT_FOUND };
  }

  const model = getNodeModel(node.type);
  if (!model.documentSchema) {
    return { type: 'success', output: MutationStatus.NOT_FOUND };
  }

  const context: CanUpdateDocumentContext = {
    user: {
      id: user.id,
      role: user.role,
      workspaceId: user.workspace_id,
      accountId: user.account_id,
    },
    node: mapNode(node),
    tree: tree.map((node) => mapNode(node)),
  };

  if (!model.canUpdateDocument(context)) {
    return { type: 'success', output: MutationStatus.FORBIDDEN };
  }

  const document = await database
    .selectFrom('documents')
    .where('id', '=', mutation.documentId)
    .selectAll()
    .executeTakeFirst();

  const documentUpdates = await database
    .selectFrom('document_updates')
    .where('document_id', '=', mutation.documentId)
    .selectAll()
    .execute();

  const ydoc = new YDoc();
  for (const update of documentUpdates) {
    ydoc.applyUpdate(update.data);
  }

  ydoc.applyUpdate(mutation.data);
  const content = ydoc.getObject<DocumentContent>();

  if (!model.documentSchema.safeParse(content).success) {
    return { type: 'success', output: MutationStatus.BAD_REQUEST };
  }

  try {
    const { updatedDocument, createdDocumentUpdate } = await database
      .transaction()
      .execute(async (trx) => {
        const createdDocumentUpdate = await trx
          .insertInto('document_updates')
          .returningAll()
          .values({
            id: mutation.updateId,
            document_id: mutation.documentId,
            root_id: node.root_id,
            workspace_id: user.workspace_id,
            data: decodeState(mutation.data),
            created_at: new Date(mutation.createdAt),
            created_by: user.id,
            merged_updates: null,
          })
          .executeTakeFirst();

        if (!createdDocumentUpdate) {
          throw new Error('Failed to create document update');
        }

        const updatedDocument = document
          ? await trx
              .updateTable('documents')
              .returningAll()
              .set({
                content: JSON.stringify(content),
                updated_at: new Date(mutation.createdAt),
                updated_by: user.id,
                revision: createdDocumentUpdate.revision,
              })
              .where('id', '=', mutation.documentId)
              .where('revision', '=', document.revision)
              .executeTakeFirst()
          : await trx
              .insertInto('documents')
              .returningAll()
              .values({
                id: mutation.documentId,
                workspace_id: user.workspace_id,
                content: JSON.stringify(content),
                created_at: new Date(mutation.createdAt),
                created_by: user.id,
                revision: createdDocumentUpdate.revision,
              })
              .onConflict((cb) => cb.doNothing())
              .executeTakeFirst();

        if (!updatedDocument) {
          throw new Error('Failed to create document');
        }

        return {
          updatedDocument,
          createdDocumentUpdate,
        };
      });

    if (!updatedDocument || !createdDocumentUpdate) {
      throw new Error('Failed to update document');
    }

    eventBus.publish({
      type: 'document.updated',
      documentId: mutation.documentId,
      workspaceId: user.workspace_id,
    });

    eventBus.publish({
      type: 'document.update.created',
      documentId: mutation.documentId,
      rootId: node.root_id,
      workspaceId: user.workspace_id,
    });

    await scheduleDocumentEmbedding(mutation.documentId);

    return {
      type: 'success',
      output: MutationStatus.OK,
    };
  } catch (error) {
    logger.error(error, `Failed to update document`);
    return { type: 'retry' };
  }
};
