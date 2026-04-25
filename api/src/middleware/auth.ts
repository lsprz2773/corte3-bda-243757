import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  session?: AuthPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthPayload;
    req.session = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
