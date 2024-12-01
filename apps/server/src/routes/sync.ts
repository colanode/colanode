import {
  LocalCreateNodeTransaction,
  LocalDeleteNodeTransaction,
  LocalNodeTransaction,
  LocalUpdateNodeTransaction,
  SyncNodeTransactionResult,
  SyncNodeTransactionsInput,
  SyncNodeTransactionStatus,
} from '@colanode/core';
import { Router } from 'express';

import { database } from '@/data/database';
import { SelectWorkspaceUser } from '@/data/schema';
import { nodeService } from '@/services/node-service';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';

export const syncRouter = Router();

syncRouter.post(
  '/:workspaceId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspaceId = req.params.workspaceId as string;
    const input = req.body as SyncNodeTransactionsInput;

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const results: SyncNodeTransactionResult[] = [];
    for (const transaction of input.transactions) {
      try {
        const status = await handleLocalNodeTransaction(
          workspaceUser,
          transaction
        );
        results.push({
          id: transaction.id,
          status: status,
        });
      } catch (error) {
        console.error('Error handling local transaction', error);
        results.push({
          id: transaction.id,
          status: 'error',
        });
      }
    }

    console.log('executed mutations', results);
    res.status(200).json({ results });
  }
);

const handleLocalNodeTransaction = async (
  workspaceUser: SelectWorkspaceUser,
  transaction: LocalNodeTransaction
): Promise<SyncNodeTransactionStatus> => {
  if (transaction.operation === 'create') {
    return await handleCreateNodeTransaction(workspaceUser, transaction);
  } else if (transaction.operation === 'update') {
    return await handleUpdateNodeTransaction(workspaceUser, transaction);
  } else if (transaction.operation === 'delete') {
    return await handleDeleteNodeTransaction(workspaceUser, transaction);
  } else {
    return 'error';
  }
};

const handleCreateNodeTransaction = async (
  workspaceUser: SelectWorkspaceUser,
  transaction: LocalCreateNodeTransaction
): Promise<SyncNodeTransactionStatus> => {
  const output = await nodeService.applyNodeCreateTransaction(workspaceUser, {
    id: transaction.id,
    nodeId: transaction.nodeId,
    data: transaction.data,
    createdAt: new Date(transaction.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleUpdateNodeTransaction = async (
  workspaceUser: SelectWorkspaceUser,
  transaction: LocalUpdateNodeTransaction
): Promise<SyncNodeTransactionStatus> => {
  const output = await nodeService.applyNodeUpdateTransaction(workspaceUser, {
    id: transaction.id,
    nodeId: transaction.nodeId,
    userId: transaction.createdBy,
    data: transaction.data,
    createdAt: new Date(transaction.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleDeleteNodeTransaction = async (
  workspaceUser: SelectWorkspaceUser,
  transaction: LocalDeleteNodeTransaction
): Promise<SyncNodeTransactionStatus> => {
  const output = await nodeService.applyNodeDeleteTransaction(workspaceUser, {
    id: transaction.id,
    nodeId: transaction.nodeId,
    createdAt: new Date(transaction.createdAt),
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};
