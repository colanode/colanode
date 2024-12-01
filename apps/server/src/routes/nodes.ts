import { GetNodeTransactionsOutput, hasViewerAccess } from '@colanode/core';
import { Router } from 'express';

import { database } from '@/data/database';
import { fetchNodeRole, mapNodeTransaction } from '@/lib/nodes';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';

export const nodesRouter = Router();

nodesRouter.get(
  '/:workspaceId/transactions/:nodeId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const nodeId = req.params.nodeId as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const role = await fetchNodeRole(nodeId, workspaceUser.id);
    if (role === null || !hasViewerAccess(role)) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const transactions = await database
      .selectFrom('node_transactions')
      .selectAll()
      .where('node_id', '=', nodeId)
      .orderBy('version', 'desc')
      .execute();

    const output: GetNodeTransactionsOutput = {
      transactions: transactions.map(mapNodeTransaction),
    };

    res.status(200).json(output);
  }
);
