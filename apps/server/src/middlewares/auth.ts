import { verifyToken } from '@/lib/tokens';
import {
  ApiError,
  ColanodeNextFunction,
  ColanodeRequest,
  ColanodeResponse,
} from '@/types/api';

export const authMiddleware = async (
  req: ColanodeRequest,
  res: ColanodeResponse,
  next: ColanodeNextFunction
) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Access Denied: No Token Provided!',
    });
  }

  const result = await verifyToken(token);
  if (!result.authenticated) {
    return res.status(400).json({
      code: ApiError.Unauthorized,
      message: 'Invalid Token',
    });
  }

  req.account = result.account;
  next();
};
