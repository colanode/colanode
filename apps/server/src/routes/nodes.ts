import { GetTransactionsOutput, hasViewerAccess } from '@colanode/core';
import { Request, Response, Router } from 'express';

import { database } from '@/data/database';
import { fetchNodeRole, mapTransaction } from '@/lib/nodes';
import { ApiError } from '@/types/api';

export const nodesRouter = Router();

nodesRouter.get(
  '/:workspaceId/transactions/:nodeId',
  async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const nodeId = req.params.nodeId as string;

    if (!res.locals.account) {
      res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
      return;
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
      return;
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', res.locals.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
      return;
    }

    const role = await fetchNodeRole(nodeId, workspaceUser.id);
    if (role === null || !hasViewerAccess(role)) {
      res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
      return;
    }

    const transactions = await database
      .selectFrom('transactions')
      .selectAll()
      .where('node_id', '=', nodeId)
      .orderBy('version', 'desc')
      .execute();

    const output: GetTransactionsOutput = {
      transactions: transactions.map(mapTransaction),
    };

    res.status(200).json(output);
  }
);
