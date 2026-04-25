import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = err instanceof Error ? err.message : 'Error interno';
  console.error('[ERROR]', message);
  res.status(500).json({ error: 'Error interno del servidor' });
}
