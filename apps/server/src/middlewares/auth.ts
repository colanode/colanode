import { NextFunction, Request, Response, RequestHandler } from 'express';

import { verifyToken } from '@/lib/tokens';
import { ApiError } from '@/types/api';

export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Access Denied: No Token Provided!',
    });
    return;
  }

  const result = await verifyToken(token);
  if (!result.authenticated) {
    res.status(400).json({
      code: ApiError.Unauthorized,
      message: 'Invalid Token',
    });
    return;
  }

  res.locals.account = result.account;
  next();
};
