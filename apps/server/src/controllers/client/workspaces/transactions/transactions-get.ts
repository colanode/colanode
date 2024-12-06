import { Request, Response } from 'express';
import { GetTransactionsOutput, hasViewerAccess } from '@colanode/core';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { fetchNodeRole, mapTransaction } from '@/lib/nodes';

export const transactionsGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const nodeId = req.params.nodeId as string;

  const role = await fetchNodeRole(nodeId, res.locals.workspaceUser.id);
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
};
